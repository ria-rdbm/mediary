-- Mediary: symptoms, weight_records, notes (sections 39-42)

create table if not exists public.symptoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid references public.medications (id) on delete set null,

  name text not null, -- preset label (e.g. "Nausea") or custom text when "Other"
  severity text not null check (severity in ('mild', 'moderate', 'severe')),

  start_local text not null,
  start_utc timestamptz not null,
  utc_offset_minutes integer not null,
  end_local text,
  end_utc timestamptz,
  is_ongoing boolean not null default false,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists symptoms_user_idx on public.symptoms (user_id, start_utc desc);
create index if not exists symptoms_medication_idx on public.symptoms (medication_id);

create trigger symptoms_set_updated_at
  before update on public.symptoms
  for each row execute function public.set_updated_at();

alter table public.symptoms enable row level security;
create policy "symptoms_select_own" on public.symptoms for select using (auth.uid() = user_id);
create policy "symptoms_insert_own" on public.symptoms for insert with check (auth.uid() = user_id);
create policy "symptoms_update_own" on public.symptoms for update using (auth.uid() = user_id);
create policy "symptoms_delete_own" on public.symptoms for delete using (auth.uid() = user_id);


create table if not exists public.weight_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Always stored in kg; display conversion to lb happens client-side
  -- per the user's weight_unit preference (profiles.weight_unit).
  weight_kg numeric(6, 2) not null check (weight_kg > 0),
  recorded_local text not null,
  recorded_utc timestamptz not null,
  utc_offset_minutes integer not null,
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists weight_records_user_idx on public.weight_records (user_id, recorded_utc desc);

create trigger weight_records_set_updated_at
  before update on public.weight_records
  for each row execute function public.set_updated_at();

alter table public.weight_records enable row level security;
create policy "weight_records_select_own" on public.weight_records for select using (auth.uid() = user_id);
create policy "weight_records_insert_own" on public.weight_records for insert with check (auth.uid() = user_id);
create policy "weight_records_update_own" on public.weight_records for update using (auth.uid() = user_id);
create policy "weight_records_delete_own" on public.weight_records for delete using (auth.uid() = user_id);


create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid references public.medications (id) on delete set null,

  note text not null check (char_length(trim(note)) > 0),
  occurred_local text not null,
  occurred_utc timestamptz not null,
  utc_offset_minutes integer not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_idx on public.notes (user_id, occurred_utc desc);
create index if not exists notes_medication_idx on public.notes (medication_id);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

alter table public.notes enable row level security;
create policy "notes_select_own" on public.notes for select using (auth.uid() = user_id);
create policy "notes_insert_own" on public.notes for insert with check (auth.uid() = user_id);
create policy "notes_update_own" on public.notes for update using (auth.uid() = user_id);
create policy "notes_delete_own" on public.notes for delete using (auth.uid() = user_id);
