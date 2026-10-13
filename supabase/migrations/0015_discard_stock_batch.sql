-- Lets a user discard whatever is left in one batch (expired, damaged, lost)
-- without touching the other batches. Recorded as a user manual_adjustment
-- with an allocation so the history entry can still be deleted to undo it.

create or replace function public.discard_stock_batch(p_batch_id uuid)
returns numeric
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_batch public.stock_batches;
  v_tx_id uuid;
  v_discarded numeric;
begin
  select * into v_batch from public.stock_batches
    where id = p_batch_id and user_id = auth.uid();
  if not found then
    raise exception 'Batch not found';
  end if;
  if v_batch.quantity <= 0 then
    raise exception 'This batch has no stock left.';
  end if;

  v_discarded := v_batch.quantity;

  insert into public.stock_transactions (
    user_id, medication_id, type, source, quantity, stock_unit, stock_unit_custom, note
  ) values (
    auth.uid(), v_batch.medication_id, 'manual_adjustment', 'user', -v_discarded,
    v_batch.stock_unit, v_batch.stock_unit_custom, 'Batch discarded'
  ) returning id into v_tx_id;

  insert into public.stock_transaction_allocations (stock_transaction_id, stock_batch_id, quantity)
  values (v_tx_id, v_batch.id, -v_discarded);

  update public.stock_batches set quantity = 0 where id = v_batch.id;

  return v_discarded;
end;
$$;

revoke execute on function public.discard_stock_batch(uuid) from public;
grant execute on function public.discard_stock_batch(uuid) to authenticated;
