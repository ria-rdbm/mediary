-- Mediary: apple_credentials
-- Stores the Apple OAuth refresh token obtained server-side (via the
-- `apple-token-exchange` Edge Function) immediately after a native Sign in
-- with Apple, solely so account deletion can revoke it with Apple
-- (required by Apple's Sign in with Apple guidelines). Never readable by
-- the client — RLS is enabled with zero policies, so only the service_role
-- key (used exclusively inside Edge Functions) can touch this table.

create table if not exists public.apple_credentials (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger apple_credentials_set_updated_at
  before update on public.apple_credentials
  for each row execute function public.set_updated_at();

alter table public.apple_credentials enable row level security;
-- Intentionally no policies: inaccessible to anon/authenticated roles.
