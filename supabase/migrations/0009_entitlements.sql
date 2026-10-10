-- Mediary: entitlements (trial + Lifetime Access state, sections 65-71)
--
-- This table is the client-readable mirror of purchase truth. Clients can
-- only SELECT their own row — there is deliberately no insert/update policy
-- for the `authenticated` role. Writes happen only via:
--   1. public.start_trial() — a SECURITY DEFINER RPC (idempotent, sets
--      trial_started_at once).
--   2. The `revenuecat-webhook` and `sync-entitlement` Edge Functions,
--      which use the service_role key and so bypass RLS entirely.
-- This is what satisfies "do not trust a simple local boolean for purchase
-- entitlement" — the mobile app never writes lifetime_purchased_at itself.

create table if not exists public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,

  trial_started_at timestamptz,
  trial_length_days integer not null default 30,

  lifetime_purchased_at timestamptz,
  revenuecat_app_user_id text,
  store text check (store in ('app_store', 'play_store')),
  last_verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

alter table public.entitlements enable row level security;

create policy "entitlements_select_own" on public.entitlements for select using (auth.uid() = user_id);
-- No insert/update/delete policy for authenticated clients by design.

create or replace function public.start_trial()
returns public.entitlements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.entitlements;
begin
  insert into public.entitlements (user_id, trial_started_at)
  values (auth.uid(), now())
  on conflict (user_id) do nothing;

  select * into v_row from public.entitlements where user_id = auth.uid();
  return v_row;
end;
$$;

-- Revoke the default PUBLIC grant first (REVOKE ... FROM anon alone would
-- leave it in place), then grant only to authenticated.
revoke execute on function public.start_trial() from public;
grant execute on function public.start_trial() to authenticated;
