-- Mediary: appointments, provider_questions, appointment_reminders (sections 43-50)

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid references public.medications (id) on delete set null,
  provider_id uuid references public.providers (id) on delete set null,
  -- Denormalised so the provider's name at the time of the visit survives
  -- even if the saved provider entry is later edited or deleted.
  provider_name_snapshot text,

  visit_local text not null,
  visit_utc timestamptz not null,
  utc_offset_minutes integer not null,

  provider_instructions text,
  my_notes text,
  treatment_changes text,
  next_appointment_local text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_user_idx on public.appointments (user_id, visit_utc desc);
create index if not exists appointments_medication_idx on public.appointments (medication_id);

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

alter table public.appointments enable row level security;
create policy "appointments_select_own" on public.appointments for select using (auth.uid() = user_id);
create policy "appointments_insert_own" on public.appointments for insert with check (auth.uid() = user_id);
create policy "appointments_update_own" on public.appointments for update using (auth.uid() = user_id);
create policy "appointments_delete_own" on public.appointments for delete using (auth.uid() = user_id);


create table if not exists public.provider_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  appointment_id uuid not null references public.appointments (id) on delete cascade,

  question text not null check (char_length(trim(question)) > 0),
  is_checked boolean not null default false,
  position integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provider_questions_appointment_idx
  on public.provider_questions (appointment_id, position);

create trigger provider_questions_set_updated_at
  before update on public.provider_questions
  for each row execute function public.set_updated_at();

alter table public.provider_questions enable row level security;
create policy "provider_questions_select_own" on public.provider_questions for select using (auth.uid() = user_id);
create policy "provider_questions_insert_own" on public.provider_questions for insert with check (auth.uid() = user_id);
create policy "provider_questions_update_own" on public.provider_questions for update using (auth.uid() = user_id);
create policy "provider_questions_delete_own" on public.provider_questions for delete using (auth.uid() = user_id);


create table if not exists public.appointment_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  appointment_id uuid not null references public.appointments (id) on delete cascade,

  -- Preset offsets store minutes_before; "Custom" stores an absolute local
  -- civil datetime instead.
  minutes_before integer,
  custom_local text,
  notification_id text,

  created_at timestamptz not null default now(),

  constraint appointment_reminders_one_trigger check (
    (minutes_before is not null and custom_local is null)
    or (minutes_before is null and custom_local is not null)
  )
);

create index if not exists appointment_reminders_appointment_idx
  on public.appointment_reminders (appointment_id);

alter table public.appointment_reminders enable row level security;
create policy "appointment_reminders_select_own" on public.appointment_reminders for select using (auth.uid() = user_id);
create policy "appointment_reminders_insert_own" on public.appointment_reminders for insert with check (auth.uid() = user_id);
create policy "appointment_reminders_delete_own" on public.appointment_reminders for delete using (auth.uid() = user_id);
