-- Mediary: profiles
-- One row per authenticated user. Created automatically on signup via trigger.
-- Holds app preferences and onboarding state. Trial/purchase state lives in
-- `entitlements` (0009), kept separate so its write path can be locked down
-- independently from user-editable preferences.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  disclaimer_acknowledged_at timestamptz,
  onboarding_completed_at timestamptz,
  onboarding_categories text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Per-user app preferences and onboarding state.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-provision a profile (and a trial-less entitlement row is created
-- separately via the start_trial() RPC on first authenticated app open).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- This only needs to run via the trigger above, never as a direct RPC call.
-- Trigger invocation runs with definer's rights regardless of EXECUTE
-- grants, so revoking from PUBLIC (not just anon/authenticated, which only
-- strips role-specific grants and leaves the default PUBLIC grant intact)
-- fully blocks direct RPC calls without breaking the trigger.
revoke execute on function public.handle_new_user() from public;

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- No insert/delete policy for clients: profiles are created by the trigger
-- above and removed via the auth.users cascade on account deletion.
