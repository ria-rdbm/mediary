-- Mediary: reminders
-- Medication/Treatment reminders are deliberately simple: one explicit
-- date+time per medication per day, no recurrence (section 26).
-- Appointment reminders are separate and may be multiple per appointment
-- (section 50). notification_id stores the OS-level scheduled-notification
-- identifier so the client can cancel it later.

create table if not exists public.medication_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid not null references public.medications (id) on delete cascade,

  reminder_date date not null,
  reminder_time text not null, -- "HH:mm", 24h stored value
  is_active boolean not null default true,
  notification_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (medication_id, reminder_date)
);

create index if not exists medication_reminders_user_idx on public.medication_reminders (user_id);
create index if not exists medication_reminders_upcoming_idx
  on public.medication_reminders (user_id, reminder_date) where is_active;

create trigger medication_reminders_set_updated_at
  before update on public.medication_reminders
  for each row execute function public.set_updated_at();

alter table public.medication_reminders enable row level security;

create policy "medication_reminders_select_own" on public.medication_reminders for select using (auth.uid() = user_id);
create policy "medication_reminders_insert_own" on public.medication_reminders for insert with check (auth.uid() = user_id);
create policy "medication_reminders_update_own" on public.medication_reminders for update using (auth.uid() = user_id);
create policy "medication_reminders_delete_own" on public.medication_reminders for delete using (auth.uid() = user_id);
