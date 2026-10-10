-- Mediary: medications (the "Medication / Treatment" entity)

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  category text not null check (
    category in ('glp1', 'insulin', 'other_medication', 'cosmetic_treatment', 'other_health_injection')
  ),
  status text not null default 'active' check (status in ('active', 'paused', 'finished')),
  finished_at date,
  color text, -- hex value chosen from the curated palette; null = automatic default by category
  default_provider_id uuid references public.providers (id) on delete set null,

  -- Dose amount convenience defaults (section 18-19). These never mutate
  -- historical treatment_records.
  default_amount numeric(10, 3),
  default_amount_unit text check (default_amount_unit in ('mg', 'mcg', 'mL', 'units', 'Other')),
  default_amount_unit_custom text,
  last_amount_unit text check (last_amount_unit in ('mg', 'mcg', 'mL', 'units', 'Other')),
  last_amount_unit_custom text,

  -- Stock configuration (sections 27-37). stock_unit is the single active
  -- unit for this medication; it may only change while total stock is 0
  -- (enforced in add_stock_batch()).
  stock_unit text check (stock_unit in ('pen', 'vial', 'shots', 'units', 'mL', 'Other')),
  stock_unit_custom text,
  auto_deduct_stock boolean not null default true,
  stock_used_per_injection numeric(10, 3),
  low_stock_threshold numeric(10, 3),
  low_stock_notified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists medications_user_id_idx on public.medications (user_id);
create index if not exists medications_user_status_idx on public.medications (user_id, status);

create trigger medications_set_updated_at
  before update on public.medications
  for each row execute function public.set_updated_at();

alter table public.medications enable row level security;

create policy "medications_select_own" on public.medications for select using (auth.uid() = user_id);
create policy "medications_insert_own" on public.medications for insert with check (auth.uid() = user_id);
create policy "medications_update_own" on public.medications for update using (auth.uid() = user_id);
-- No delete policy: medications are never deleted in V1, only status-changed,
-- so historical records can never be orphaned.
