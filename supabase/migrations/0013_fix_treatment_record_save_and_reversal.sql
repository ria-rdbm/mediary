-- Mediary: two fixes to the treatment-record stock engine (0011).
--
-- 1) log_treatment_record / update_treatment_record read `v_deduct.deducted`
--    even when no stock was deducted (Not Taken records, or medications with
--    no stock usage). A plpgsql `record` variable that was never assigned
--    raises 'record "v_deduct" is not assigned yet', so those saves failed.
--    The deduct result now lives in plain numeric variables that default to 0.
--
-- 2) _stock_reverse_for_record marks the original transaction
--    `reversed = true`, but stock_transactions had no UPDATE policy, so the
--    update silently matched zero rows. The original deduct stayed "active"
--    and every later edit or delete of the record reversed it again, pushing
--    stock above what was ever added. Rows stay append-only for every other
--    column: only `reversed` can be updated, and only on the user's own rows.

-- ---------------------------------------------------------------------------
-- 2) allow flipping `reversed` on your own stock transactions, nothing else
-- ---------------------------------------------------------------------------
revoke update on public.stock_transactions from anon, authenticated;
grant update (reversed) on public.stock_transactions to authenticated;

create policy "stock_transactions_update_own" on public.stock_transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 1) log_treatment_record
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
  v_deducted numeric := 0;
  v_shortfall numeric := 0;
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
    select d.deducted, d.shortfall into v_deducted, v_shortfall
      from public._stock_deduct(p_medication_id, p_stock_used, 'deduct', 'system', v_record.id, null) d;
  end if;

  -- Cancel this day's medication reminder, if one is active (section 26).
  v_reminder_date := (split_part(p_occurred_local, 'T', 1))::date;
  update public.medication_reminders
    set is_active = false
    where medication_id = p_medication_id and reminder_date = v_reminder_date and is_active = true
    returning notification_id into v_cancelled_notification_id;

  return jsonb_build_object(
    'record', to_jsonb(v_record),
    'stock_deducted', v_deducted,
    'stock_shortfall', v_shortfall,
    'cancelled_reminder_notification_id', v_cancelled_notification_id
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 1) update_treatment_record
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
  v_deducted numeric := 0;
  v_shortfall numeric := 0;
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
    select d.deducted, d.shortfall into v_deducted, v_shortfall
      from public._stock_deduct(p_medication_id, p_stock_used, 'deduct', 'system', v_record.id, null) d;
  end if;

  return jsonb_build_object(
    'record', to_jsonb(v_record),
    'stock_deducted', v_deducted,
    'stock_shortfall', v_shortfall
  );
end;
$$;
