-- Mediary: stock engine RPC functions (sections 27-37, 81-82)
--
-- Every function below is SECURITY INVOKER and scoped to auth.uid(), so
-- Postgres' normal RLS policies still apply underneath — these functions
-- exist purely to make multi-table stock mutations atomic and auditable,
-- not to escalate privilege.
--
-- Core invariant: a batch's `quantity` is only ever changed in the same
-- statement that writes the stock_transactions + stock_transaction_allocations
-- rows explaining why. Reversing a change always happens by writing a new
-- 'reversal' transaction (so history is never erased) and marking the
-- original transaction `reversed = true` (so it can only be reversed once).

-- ---------------------------------------------------------------------------
-- internal: consume `p_quantity` (always positive) from this medication's
-- batches, earliest-expiry-first then oldest-added-first. Never pushes a
-- batch below 0. Returns the amount actually deducted (may be less than
-- requested if recorded stock is insufficient — section 34) and writes the
-- transaction + allocations.
-- ---------------------------------------------------------------------------
create or replace function public._stock_deduct(
  p_medication_id uuid,
  p_quantity numeric,
  p_type text, -- 'deduct' | 'manual_adjustment'
  p_source text, -- 'system' | 'user'
  p_source_record_id uuid,
  p_note text
)
returns table (transaction_id uuid, deducted numeric, shortfall numeric)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_medication public.medications;
  v_batch record;
  v_remaining numeric := p_quantity;
  v_take numeric;
  v_transaction_id uuid;
begin
  select * into v_medication from public.medications
    where id = p_medication_id and user_id = auth.uid();
  if not found then
    raise exception 'Medication not found';
  end if;

  insert into public.stock_transactions
    (user_id, medication_id, type, source, source_record_id, quantity, stock_unit, stock_unit_custom, note)
  values
    (auth.uid(), p_medication_id, p_type, p_source, p_source_record_id, -p_quantity,
     coalesce(v_medication.stock_unit, 'Other'), v_medication.stock_unit_custom, p_note)
  returning id into v_transaction_id;

  for v_batch in
    select * from public.stock_batches
    where medication_id = p_medication_id and user_id = auth.uid() and quantity > 0
    order by (expiry_date is null) asc, expiry_date asc, created_at asc
  loop
    exit when v_remaining <= 0;
    v_take := least(v_remaining, v_batch.quantity);

    update public.stock_batches set quantity = quantity - v_take where id = v_batch.id;

    insert into public.stock_transaction_allocations (stock_transaction_id, stock_batch_id, quantity)
    values (v_transaction_id, v_batch.id, -v_take);

    v_remaining := v_remaining - v_take;
  end loop;

  return query select v_transaction_id, (p_quantity - v_remaining), v_remaining;
end;
$$;

-- Internal helper — never meant to be called directly.
revoke execute on function public._stock_deduct(uuid, numeric, text, text, uuid, text) from public;

-- ---------------------------------------------------------------------------
-- internal: reverse the active (not yet reversed) deduct/manual_adjustment
-- transaction(s) linked to a specific source_record_id, if any. Adds the
-- quantity back to the exact batches it came from and writes a 'reversal'
-- transaction per original for audit purposes.
-- ---------------------------------------------------------------------------
create or replace function public._stock_reverse_for_record(p_record_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tx record;
  v_alloc record;
  v_reversal_id uuid;
begin
  for v_tx in
    select * from public.stock_transactions
    where source_record_id = p_record_id and user_id = auth.uid()
      and type = 'deduct' and reversed = false
  loop
    insert into public.stock_transactions
      (user_id, medication_id, type, source, source_record_id, quantity, stock_unit, stock_unit_custom, note)
    values
      (auth.uid(), v_tx.medication_id, 'reversal', 'system', p_record_id, -v_tx.quantity,
       v_tx.stock_unit, v_tx.stock_unit_custom, 'Reversal of edited/deleted record')
    returning id into v_reversal_id;

    for v_alloc in
      select * from public.stock_transaction_allocations where stock_transaction_id = v_tx.id
    loop
      update public.stock_batches set quantity = quantity - v_alloc.quantity where id = v_alloc.stock_batch_id;
      insert into public.stock_transaction_allocations (stock_transaction_id, stock_batch_id, quantity)
      values (v_reversal_id, v_alloc.stock_batch_id, -v_alloc.quantity);
    end loop;

    update public.stock_transactions set reversed = true where id = v_tx.id;
  end loop;
end;
$$;

-- Internal helper — never meant to be called directly.
revoke execute on function public._stock_reverse_for_record(uuid) from public;

-- ---------------------------------------------------------------------------
-- public: create a treatment record, deducting stock when applicable.
-- ---------------------------------------------------------------------------
create or replace function public.log_treatment_record(
  p_medication_id uuid,
  p_taken boolean,
  p_occurred_local text,
  p_occurred_utc timestamptz,
  p_utc_offset_minutes integer,
  p_amount numeric default null,
  p_amount_unit text default null,
  p_amount_unit_custom text default null,
  p_site text default null,
  p_site_custom text default null,
  p_treatment_area text default null,
  p_notes text default null,
  p_stock_used numeric default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_medication public.medications;
  v_record public.treatment_records;
  v_deduct record;
  v_cancelled_notification_id text;
  v_reminder_date date;
begin
  select * into v_medication from public.medications
    where id = p_medication_id and user_id = auth.uid();
  if not found then
    raise exception 'Medication not found';
  end if;
  if p_occurred_utc > now() + interval '2 minutes' then
    raise exception 'Future completed records are not allowed';
  end if;

  insert into public.treatment_records (
    user_id, medication_id, taken, occurred_local, occurred_utc, utc_offset_minutes,
    amount, amount_unit, amount_unit_custom, site, site_custom, treatment_area, notes,
    stock_used, stock_unit_at_time
  ) values (
    auth.uid(), p_medication_id, p_taken, p_occurred_local, p_occurred_utc, p_utc_offset_minutes,
    p_amount, p_amount_unit, p_amount_unit_custom, p_site, p_site_custom, p_treatment_area, p_notes,
    case when p_taken then p_stock_used else null end,
    case when p_taken then v_medication.stock_unit else null end
  ) returning * into v_record;

  if p_amount_unit is not null then
    update public.medications
      set last_amount_unit = p_amount_unit, last_amount_unit_custom = p_amount_unit_custom
      where id = p_medication_id;
  end if;

  if p_taken and v_medication.auto_deduct_stock and p_stock_used is not null and p_stock_used > 0 then
    select * into v_deduct from public._stock_deduct(
      p_medication_id, p_stock_used, 'deduct', 'system', v_record.id, null
    );
  end if;

  -- Cancel this day's medication reminder, if one is active (section 26).
  v_reminder_date := (split_part(p_occurred_local, 'T', 1))::date;
  update public.medication_reminders
    set is_active = false
    where medication_id = p_medication_id and reminder_date = v_reminder_date and is_active = true
    returning notification_id into v_cancelled_notification_id;

  return jsonb_build_object(
    'record', to_jsonb(v_record),
    'stock_deducted', coalesce(v_deduct.deducted, 0),
    'stock_shortfall', coalesce(v_deduct.shortfall, 0),
    'cancelled_reminder_notification_id', v_cancelled_notification_id
  );
end;
$$;

revoke execute on function public.log_treatment_record(
  uuid, boolean, text, timestamptz, integer, numeric, text, text, text, text, text, text, numeric
) from public;
grant execute on function public.log_treatment_record(
  uuid, boolean, text, timestamptz, integer, numeric, text, text, text, text, text, text, numeric
) to authenticated;

-- ---------------------------------------------------------------------------
-- public: update an existing treatment record. Always fully reverses any
-- prior stock effect before reapplying, so repeated edits can never
-- double-deduct.
-- ---------------------------------------------------------------------------
create or replace function public.update_treatment_record(
  p_record_id uuid,
  p_medication_id uuid,
  p_taken boolean,
  p_occurred_local text,
  p_occurred_utc timestamptz,
  p_utc_offset_minutes integer,
  p_amount numeric default null,
  p_amount_unit text default null,
  p_amount_unit_custom text default null,
  p_site text default null,
  p_site_custom text default null,
  p_treatment_area text default null,
  p_notes text default null,
  p_stock_used numeric default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_medication public.medications;
  v_record public.treatment_records;
  v_deduct record;
begin
  select * into v_medication from public.medications
    where id = p_medication_id and user_id = auth.uid();
  if not found then
    raise exception 'Medication not found';
  end if;
  if p_occurred_utc > now() + interval '2 minutes' then
    raise exception 'Future completed records are not allowed';
  end if;

  perform public._stock_reverse_for_record(p_record_id);

  update public.treatment_records set
    medication_id = p_medication_id,
    taken = p_taken,
    occurred_local = p_occurred_local,
    occurred_utc = p_occurred_utc,
    utc_offset_minutes = p_utc_offset_minutes,
    amount = p_amount,
    amount_unit = p_amount_unit,
    amount_unit_custom = p_amount_unit_custom,
    site = p_site,
    site_custom = p_site_custom,
    treatment_area = p_treatment_area,
    notes = p_notes,
    stock_used = case when p_taken then p_stock_used else null end,
    stock_unit_at_time = case when p_taken then v_medication.stock_unit else null end
  where id = p_record_id and user_id = auth.uid()
  returning * into v_record;

  if not found then
    raise exception 'Record not found';
  end if;

  if p_amount_unit is not null then
    update public.medications
      set last_amount_unit = p_amount_unit, last_amount_unit_custom = p_amount_unit_custom
      where id = p_medication_id;
  end if;

  if p_taken and v_medication.auto_deduct_stock and p_stock_used is not null and p_stock_used > 0 then
    select * into v_deduct from public._stock_deduct(
      p_medication_id, p_stock_used, 'deduct', 'system', v_record.id, null
    );
  end if;

  return jsonb_build_object(
    'record', to_jsonb(v_record),
    'stock_deducted', coalesce(v_deduct.deducted, 0),
    'stock_shortfall', coalesce(v_deduct.shortfall, 0)
  );
end;
$$;

revoke execute on function public.update_treatment_record(
  uuid, uuid, boolean, text, timestamptz, integer, numeric, text, text, text, text, text, text, numeric
) from public;
grant execute on function public.update_treatment_record(
  uuid, uuid, boolean, text, timestamptz, integer, numeric, text, text, text, text, text, text, numeric
) to authenticated;

-- ---------------------------------------------------------------------------
-- public: delete a treatment record, reversing any stock effect first.
-- ---------------------------------------------------------------------------
create or replace function public.delete_treatment_record(p_record_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public._stock_reverse_for_record(p_record_id);

  delete from public.treatment_records where id = p_record_id and user_id = auth.uid();
  if not found then
    raise exception 'Record not found';
  end if;
end;
$$;

revoke execute on function public.delete_treatment_record(uuid) from public;
grant execute on function public.delete_treatment_record(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- public: apply a stock-used amount to an already-saved Taken record (the
-- "Update stock?" follow-up prompt in section 29), optionally remembering
-- it as the medication's future default.
-- ---------------------------------------------------------------------------
create or replace function public.record_stock_usage(
  p_record_id uuid,
  p_stock_used numeric,
  p_remember_default boolean default false
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_record public.treatment_records;
  v_deduct record;
begin
  select * into v_record from public.treatment_records
    where id = p_record_id and user_id = auth.uid();
  if not found then
    raise exception 'Record not found';
  end if;
  if not v_record.taken then
    raise exception 'Only Taken records can deduct stock';
  end if;

  perform public._stock_reverse_for_record(p_record_id);

  select * into v_deduct from public._stock_deduct(
    v_record.medication_id, p_stock_used, 'deduct', 'system', p_record_id, null
  );

  update public.treatment_records set stock_used = p_stock_used where id = p_record_id;

  if p_remember_default then
    update public.medications set stock_used_per_injection = p_stock_used where id = v_record.medication_id;
  end if;

  return jsonb_build_object('stock_deducted', v_deduct.deducted, 'stock_shortfall', v_deduct.shortfall);
end;
$$;

revoke execute on function public.record_stock_usage(uuid, numeric, boolean) from public;
grant execute on function public.record_stock_usage(uuid, numeric, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- public: add a new stock batch (covers both the simple "Add Stock" flow,
-- which only sets quantity, and the full batch form with expiry/lot/barcode).
-- Enforces the single-active-stock-unit rule (section 28).
-- ---------------------------------------------------------------------------
create or replace function public.add_stock_batch(
  p_medication_id uuid,
  p_quantity numeric,
  p_stock_unit text,
  p_stock_unit_custom text default null,
  p_expiry_date date default null,
  p_batch_number text default null,
  p_barcode text default null
)
returns public.stock_batches
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_medication public.medications;
  v_total_stock numeric;
  v_batch public.stock_batches;
begin
  select * into v_medication from public.medications
    where id = p_medication_id and user_id = auth.uid();
  if not found then
    raise exception 'Medication not found';
  end if;

  if v_medication.stock_unit is not null and v_medication.stock_unit <> p_stock_unit then
    select coalesce(sum(quantity), 0) into v_total_stock
      from public.stock_batches where medication_id = p_medication_id;
    if v_total_stock > 0 then
      raise exception 'Stock unit can only be changed when the current stock is 0.';
    end if;
  end if;

  update public.medications
    set stock_unit = p_stock_unit, stock_unit_custom = p_stock_unit_custom
    where id = p_medication_id;

  insert into public.stock_batches (
    user_id, medication_id, quantity, initial_quantity, stock_unit, stock_unit_custom,
    expiry_date, batch_number, barcode
  ) values (
    auth.uid(), p_medication_id, p_quantity, p_quantity, p_stock_unit, p_stock_unit_custom,
    p_expiry_date, p_batch_number, p_barcode
  ) returning * into v_batch;

  insert into public.stock_transactions (
    user_id, medication_id, type, source, quantity, stock_unit, stock_unit_custom
  ) values (
    auth.uid(), p_medication_id, 'add', 'user', p_quantity, p_stock_unit, p_stock_unit_custom
  );

  -- Reset the low-stock notification gate now that stock has increased.
  update public.medications set low_stock_notified_at = null where id = p_medication_id;

  return v_batch;
end;
$$;

revoke execute on function public.add_stock_batch(uuid, numeric, text, text, date, text, text) from public;
grant execute on function public.add_stock_batch(uuid, numeric, text, text, date, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- public: manual stock adjustment — user enters Actual Stock, we compute
-- the diff and apply it (section 36). Positive diff creates a new
-- "found extra stock" batch; negative diff deducts earliest-expiry-first.
-- ---------------------------------------------------------------------------
create or replace function public.manual_stock_adjustment(
  p_medication_id uuid,
  p_actual_stock numeric
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_medication public.medications;
  v_recorded numeric;
  v_diff numeric;
  v_deduct record;
  v_batch public.stock_batches;
begin
  select * into v_medication from public.medications
    where id = p_medication_id and user_id = auth.uid();
  if not found then
    raise exception 'Medication not found';
  end if;

  select coalesce(sum(quantity), 0) into v_recorded
    from public.stock_batches where medication_id = p_medication_id;

  v_diff := p_actual_stock - v_recorded;

  if v_diff = 0 then
    return jsonb_build_object('diff', 0);
  elsif v_diff > 0 then
    insert into public.stock_batches (
      user_id, medication_id, quantity, initial_quantity, stock_unit, stock_unit_custom
    ) values (
      auth.uid(), p_medication_id, v_diff, v_diff,
      coalesce(v_medication.stock_unit, 'Other'), v_medication.stock_unit_custom
    ) returning * into v_batch;

    insert into public.stock_transactions (
      user_id, medication_id, type, source, quantity, stock_unit, stock_unit_custom, note
    ) values (
      auth.uid(), p_medication_id, 'manual_adjustment', 'user', v_diff,
      coalesce(v_medication.stock_unit, 'Other'), v_medication.stock_unit_custom, 'Manual adjustment'
    );
  else
    select * into v_deduct from public._stock_deduct(
      p_medication_id, abs(v_diff), 'manual_adjustment', 'user', null, 'Manual adjustment'
    );
  end if;

  update public.medications set low_stock_notified_at = null where id = p_medication_id;

  return jsonb_build_object('diff', v_diff);
end;
$$;

revoke execute on function public.manual_stock_adjustment(uuid, numeric) from public;
grant execute on function public.manual_stock_adjustment(uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- public: delete a user-created stock transaction ('add' or
-- 'manual_adjustment' only — system-generated rows are controlled by their
-- source record and cannot be deleted directly). For 'add', the batch it
-- created must still be untouched.
-- ---------------------------------------------------------------------------
create or replace function public.delete_stock_transaction(p_transaction_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tx public.stock_transactions;
  v_alloc record;
  v_batch public.stock_batches;
begin
  select * into v_tx from public.stock_transactions
    where id = p_transaction_id and user_id = auth.uid();
  if not found then
    raise exception 'Transaction not found';
  end if;
  if v_tx.source <> 'user' then
    raise exception 'Only user-created stock entries can be deleted';
  end if;

  for v_alloc in
    select * from public.stock_transaction_allocations where stock_transaction_id = v_tx.id
  loop
    select * into v_batch from public.stock_batches where id = v_alloc.stock_batch_id;
    if v_tx.type = 'add' and v_batch.quantity <> v_batch.initial_quantity then
      raise exception 'This batch has already been used, so it can''t be removed. Use a manual adjustment instead.';
    end if;
    update public.stock_batches set quantity = quantity - v_alloc.quantity where id = v_batch.id;
  end loop;

  delete from public.stock_transactions where id = v_tx.id;
end;
$$;

revoke execute on function public.delete_stock_transaction(uuid) from public;
grant execute on function public.delete_stock_transaction(uuid) to authenticated;
