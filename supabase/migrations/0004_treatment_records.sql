-- Mediary: treatment_records (the "Injection / Treatment Record" entity)
-- occurred_local is the authoritative value for display (civil wall-clock,
-- no timezone) — see src/lib/dateTime.ts. occurred_utc exists purely for
-- chronological sorting/range queries.

create table if not exists public.treatment_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid not null references public.medications (id) on delete restrict,

  taken boolean not null,
  occurred_local text not null,
  occurred_utc timestamptz not null,
  utc_offset_minutes integer not null,

  amount numeric(10, 3),
  amount_unit text check (amount_unit in ('mg', 'mcg', 'mL', 'units', 'Other')),
  amount_unit_custom text,

  site text, -- one of the preset injection sites, or 'Other'
  site_custom text,
  treatment_area text, -- free text, cosmetic treatments only

  notes text,

  -- How much stock this specific record consumed (null = not yet decided /
  -- not applicable). Independent from medication.stock_used_per_injection,
  -- which is only a future-default convenience value.
  stock_used numeric(10, 3),
  stock_unit_at_time text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists treatment_records_user_id_idx on public.treatment_records (user_id);
create index if not exists treatment_records_medication_idx on public.treatment_records (medication_id);
create index if not exists treatment_records_occurred_utc_idx on public.treatment_records (user_id, occurred_utc desc);

create trigger treatment_records_set_updated_at
  before update on public.treatment_records
  for each row execute function public.set_updated_at();

alter table public.treatment_records enable row level security;

create policy "treatment_records_select_own" on public.treatment_records for select using (auth.uid() = user_id);
-- Insert/update/delete all go through RPC functions (0011) so stock effects
-- stay consistent, but the underlying table policies still scope every
-- operation to auth.uid() = user_id as a second line of defense.
create policy "treatment_records_insert_own" on public.treatment_records for insert with check (auth.uid() = user_id);
create policy "treatment_records_update_own" on public.treatment_records for update using (auth.uid() = user_id);
create policy "treatment_records_delete_own" on public.treatment_records for delete using (auth.uid() = user_id);
