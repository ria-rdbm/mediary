-- Stock "add" and positive "manual_adjustment" transactions were created without
-- a stock_transaction_allocations row, so delete_stock_transaction removed the
-- history entry but left the batch quantity untouched (stock did not go down).
-- This migration records the allocation for new rows and backfills existing ones.

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
  v_tx_id uuid;
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
  ) returning id into v_tx_id;

  -- Link the transaction to the batch it created so delete_stock_transaction
  -- can take the quantity back out of that batch.
  insert into public.stock_transaction_allocations (stock_transaction_id, stock_batch_id, quantity)
  values (v_tx_id, v_batch.id, p_quantity);

  -- Reset the low-stock notification gate now that stock has increased.
  update public.medications set low_stock_notified_at = null where id = p_medication_id;

  return v_batch;
end;
$$;

revoke execute on function public.add_stock_batch(uuid, numeric, text, text, date, text, text) from public;
grant execute on function public.add_stock_batch(uuid, numeric, text, text, date, text, text) to authenticated;

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
  v_tx_id uuid;
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
    ) returning id into v_tx_id;

    insert into public.stock_transaction_allocations (stock_transaction_id, stock_batch_id, quantity)
    values (v_tx_id, v_batch.id, v_diff);
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

-- Backfill: link existing add / positive manual_adjustment transactions to the
-- batch created in the same call (same medication, same quantity, created
-- within a couple of seconds, batch not yet linked to any transaction).
insert into public.stock_transaction_allocations (stock_transaction_id, stock_batch_id, quantity)
select t.id, b.id, t.quantity
from public.stock_transactions t
join lateral (
  select sb.id
  from public.stock_batches sb
  where sb.medication_id = t.medication_id
    and sb.user_id = t.user_id
    and sb.initial_quantity = t.quantity
    and abs(extract(epoch from (sb.created_at - t.created_at))) < 2
    and not exists (select 1 from public.stock_transaction_allocations a where a.stock_batch_id = sb.id)
  order by abs(extract(epoch from (sb.created_at - t.created_at)))
  limit 1
) b on true
where t.type in ('add', 'manual_adjustment')
  and t.quantity > 0
  and t.source = 'user'
  and not exists (select 1 from public.stock_transaction_allocations a where a.stock_transaction_id = t.id);
