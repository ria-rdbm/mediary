-- pgTAP tests for the stock engine RPCs (supabase/migrations/0011_*.sql).
--
-- Run with: supabase start   (requires Docker — not available in the
--           environment this suite was authored in, so these have not been
--           executed; review before relying on them)
--           supabase test db
--
-- Pattern: insert two fake auth.users directly (cascades to profiles +
-- entitlements via existing triggers/defaults), then impersonate each one
-- with `set local role authenticated; set local request.jwt.claim.sub = ...`
-- so auth.uid() and RLS behave exactly as they would for a real request.
begin;
select plan(17);

-- ---------------------------------------------------------------------------
-- fixtures
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bob@example.com');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into public.medications (id, user_id, name, category)
values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Insulin', 'insulin');

-- ---------------------------------------------------------------------------
-- add_stock_batch: first batch sets the medication's stock_unit
-- ---------------------------------------------------------------------------
select add_stock_batch('aaaaaaaa-0000-0000-0000-000000000001', 2, 'shots', null, '2026-01-01'::date, null, null);
select add_stock_batch('aaaaaaaa-0000-0000-0000-000000000001', 100, 'shots', null, '2026-06-01'::date, null, null);

select is(
  (select stock_unit from public.medications where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'shots',
  'add_stock_batch sets the medication stock_unit on first use'
);

select is(
  (select total_quantity from public.medication_stock_totals where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  102::numeric,
  'total stock across both batches is 102'
);

-- The single-active-stock-unit guard (section 28): changing unit while
-- stock > 0 must fail.
select throws_like(
  $$ select add_stock_batch('aaaaaaaa-0000-0000-0000-000000000001', 1, 'vial', null, null, null, null) $$,
  '%Stock unit can only be changed when the current stock is 0%',
  'add_stock_batch rejects a unit change while stock remains'
);

-- ---------------------------------------------------------------------------
-- log_treatment_record: multi-batch deduction, exact spec example
-- (Batch A = 2, Batch B = 100, use 9 -> A:0, B:93)
-- ---------------------------------------------------------------------------
select lives_ok(
  $$ select log_treatment_record(
       'aaaaaaaa-0000-0000-0000-000000000001', true,
       '2026-01-10T08:00:00', '2026-01-09T20:00:00Z'::timestamptz, 780,
       9, 'units', null, null, null, null, null, 9
     ) $$,
  'log_treatment_record succeeds for a Taken record with stock_used = 9'
);

select is(
  (select total_quantity from public.medication_stock_totals where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  93::numeric,
  'multi-batch deduction leaves exactly 93 remaining (102 - 9)'
);

select is(
  (select quantity from public.stock_batches where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001' and expiry_date = '2026-01-01'),
  0::numeric,
  'the earliest-expiry batch (2 shots) was fully consumed first'
);

select is(
  (select quantity from public.stock_batches where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001' and expiry_date = '2026-06-01'),
  93::numeric,
  'the remaining 7 shots came out of the later-expiry batch'
);

-- ---------------------------------------------------------------------------
-- insufficient stock: never go negative, report (but don't block) the gap
-- ---------------------------------------------------------------------------
select ok(
  ((select log_treatment_record(
     'aaaaaaaa-0000-0000-0000-000000000001', true,
     '2026-01-11T08:00:00', '2026-01-10T20:00:00Z'::timestamptz, 780,
     100, 'units', null, null, null, null, null, 100
   ))->>'stock_shortfall')::numeric = 7,
  'requesting more than is on hand reports the exact shortfall (100 - 93)'
);

select is(
  (select total_quantity from public.medication_stock_totals where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0::numeric,
  'stock floors at 0 rather than going negative'
);

-- ---------------------------------------------------------------------------
-- deleting a Taken record reverses its stock effect
-- ---------------------------------------------------------------------------
select ok(
  (select count(*) from public.treatment_records where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001') = 2,
  'two treatment records exist before deletion'
);

select delete_treatment_record(
  (select id from public.treatment_records
   where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001' and occurred_local = '2026-01-11T08:00:00')
);

select is(
  (select total_quantity from public.medication_stock_totals where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  93::numeric,
  'deleting the shortfall record restores the 93 it had actually consumed'
);

-- ---------------------------------------------------------------------------
-- editing a record never double-deducts (reverse-then-reapply invariant)
-- ---------------------------------------------------------------------------
select update_treatment_record(
  (select id from public.treatment_records where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'aaaaaaaa-0000-0000-0000-000000000001', true,
  '2026-01-10T08:00:00', '2026-01-09T20:00:00Z'::timestamptz, 780,
  9, 'units', null, null, null, null, null, 9
);
select update_treatment_record(
  (select id from public.treatment_records where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'aaaaaaaa-0000-0000-0000-000000000001', true,
  '2026-01-10T08:00:00', '2026-01-09T20:00:00Z'::timestamptz, 780,
  9, 'units', null, null, null, null, null, 9
);

-- Each edit fully reverses the prior deduction before reapplying, so
-- repeating the SAME edit must leave the total exactly where it started —
-- 93 again, not 93 - 9 - 9. This is what "never double-deduct because a
-- record was edited twice" actually means (section 21/82).
select is(
  (select total_quantity from public.medication_stock_totals where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  93::numeric,
  'editing a record twice with identical values leaves stock unchanged (no double-deduction)'
);

-- Taken -> Not Taken restores the stock it had consumed (93 + 9 = 102).
select update_treatment_record(
  (select id from public.treatment_records where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'aaaaaaaa-0000-0000-0000-000000000001', false,
  '2026-01-10T08:00:00', '2026-01-09T20:00:00Z'::timestamptz, 780,
  null, null, null, null, null, null, null
);

select is(
  (select total_quantity from public.medication_stock_totals where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  102::numeric,
  'Taken -> Not Taken reverses the deduction (section 21)'
);

-- Not Taken -> Taken deducts again (102 - 9 = 93).
select update_treatment_record(
  (select id from public.treatment_records where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'aaaaaaaa-0000-0000-0000-000000000001', true,
  '2026-01-10T08:00:00', '2026-01-09T20:00:00Z'::timestamptz, 780,
  9, 'units', null, null, null, null, null, 9
);

select is(
  (select total_quantity from public.medication_stock_totals where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  93::numeric,
  'Not Taken -> Taken deducts again (section 21)'
);

-- ---------------------------------------------------------------------------
-- manual stock adjustment
-- ---------------------------------------------------------------------------
select manual_stock_adjustment('aaaaaaaa-0000-0000-0000-000000000001', 80);
select is(
  (select total_quantity from public.medication_stock_totals where medication_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  80::numeric,
  'manual_stock_adjustment moves total stock to the actual-stock value entered'
);

-- ---------------------------------------------------------------------------
-- RLS: user B must not see or touch user A's data
-- ---------------------------------------------------------------------------
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is(
  (select count(*) from public.medications where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0::bigint,
  'a different authenticated user cannot see another user''s medication row'
);

select throws_like(
  $$ select log_treatment_record(
       'aaaaaaaa-0000-0000-0000-000000000001', true,
       '2026-01-12T08:00:00', '2026-01-11T20:00:00Z'::timestamptz, 780,
       1, 'units', null, null, null, null, null, 1
     ) $$,
  '%Medication not found%',
  'a different authenticated user cannot log a record against someone else''s medication'
);

select * from finish();
rollback;
