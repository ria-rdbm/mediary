-- Mediary: convenience read views

create or replace view public.medication_stock_totals
with (security_invoker = true) as
select
  medication_id,
  user_id,
  coalesce(sum(quantity), 0) as total_quantity,
  count(*) filter (where quantity > 0) as active_batch_count,
  min(expiry_date) filter (where quantity > 0 and expiry_date is not null) as nearest_expiry
from public.stock_batches
group by medication_id, user_id;
