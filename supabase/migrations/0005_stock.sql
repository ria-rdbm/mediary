-- Mediary: stock engine tables (sections 27-37, 81-82)
--
-- stock_batches holds the authoritative remaining quantity per batch.
-- stock_transactions is the append-only audit log of every change.
-- stock_transaction_allocations links each transaction to the exact
-- batch(es) it touched, so any record can be precisely reversed later
-- without guessing which batch(es) it came from.
--
-- All mutations to these tables happen exclusively through the RPC
-- functions in 0011_stock_engine_functions.sql — the table-level RLS
-- policies below are a second line of defense, not the primary interface.

create table if not exists public.stock_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid not null references public.medications (id) on delete restrict,

  quantity numeric(10, 3) not null check (quantity >= 0),
  initial_quantity numeric(10, 3) not null check (initial_quantity > 0),
  stock_unit text not null check (stock_unit in ('pen', 'vial', 'shots', 'units', 'mL', 'Other')),
  stock_unit_custom text,

  expiry_date date,
  batch_number text,
  barcode text,

  expiry_reminder_enabled boolean not null default false,
  expiry_reminder_days_before integer,
  expiry_reminder_notification_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stock_batches_medication_idx on public.stock_batches (medication_id);
create index if not exists stock_batches_allocation_order_idx
  on public.stock_batches (medication_id, (expiry_date is null), expiry_date, created_at);

create trigger stock_batches_set_updated_at
  before update on public.stock_batches
  for each row execute function public.set_updated_at();

create table if not exists public.stock_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid not null references public.medications (id) on delete restrict,

  type text not null check (type in ('add', 'deduct', 'manual_adjustment', 'reversal')),
  source text not null check (source in ('user', 'system')),
  source_record_id uuid references public.treatment_records (id) on delete set null,

  -- Signed: positive adds stock, negative removes it.
  quantity numeric(10, 3) not null,
  stock_unit text not null,
  stock_unit_custom text,

  reversed boolean not null default false,
  note text,

  created_at timestamptz not null default now()
);

create index if not exists stock_transactions_medication_idx
  on public.stock_transactions (medication_id, created_at desc);
create index if not exists stock_transactions_source_record_idx
  on public.stock_transactions (source_record_id) where source_record_id is not null;

create table if not exists public.stock_transaction_allocations (
  id uuid primary key default gen_random_uuid(),
  stock_transaction_id uuid not null references public.stock_transactions (id) on delete cascade,
  stock_batch_id uuid not null references public.stock_batches (id) on delete restrict,
  -- Signed, mirrors the parent transaction's sign for this batch's portion.
  quantity numeric(10, 3) not null,
  created_at timestamptz not null default now()
);

create index if not exists stock_allocations_transaction_idx
  on public.stock_transaction_allocations (stock_transaction_id);
create index if not exists stock_allocations_batch_idx
  on public.stock_transaction_allocations (stock_batch_id);

alter table public.stock_batches enable row level security;
alter table public.stock_transactions enable row level security;
alter table public.stock_transaction_allocations enable row level security;

create policy "stock_batches_select_own" on public.stock_batches for select using (auth.uid() = user_id);
create policy "stock_batches_insert_own" on public.stock_batches for insert with check (auth.uid() = user_id);
create policy "stock_batches_update_own" on public.stock_batches for update using (auth.uid() = user_id);
create policy "stock_batches_delete_own" on public.stock_batches for delete using (auth.uid() = user_id);

create policy "stock_transactions_select_own" on public.stock_transactions for select using (auth.uid() = user_id);
create policy "stock_transactions_insert_own" on public.stock_transactions for insert with check (auth.uid() = user_id);
create policy "stock_transactions_delete_own" on public.stock_transactions for delete using (auth.uid() = user_id);
-- No update policy: a transaction row is never edited in place, only
-- superseded by a new 'reversal' row (append-only audit trail).

create policy "stock_allocations_select_own" on public.stock_transaction_allocations for select using (
  exists (
    select 1 from public.stock_transactions t
    where t.id = stock_transaction_id and t.user_id = auth.uid()
  )
);
create policy "stock_allocations_insert_own" on public.stock_transaction_allocations for insert with check (
  exists (
    select 1 from public.stock_transactions t
    where t.id = stock_transaction_id and t.user_id = auth.uid()
  )
);
create policy "stock_allocations_delete_own" on public.stock_transaction_allocations for delete using (
  exists (
    select 1 from public.stock_transactions t
    where t.id = stock_transaction_id and t.user_id = auth.uid()
  )
);
