-- Mediary: providers (lightweight reusable Provider / Clinic entries)

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists providers_user_id_idx on public.providers (user_id);
create index if not exists providers_last_used_idx on public.providers (user_id, last_used_at desc);

create trigger providers_set_updated_at
  before update on public.providers
  for each row execute function public.set_updated_at();

alter table public.providers enable row level security;

create policy "providers_select_own" on public.providers for select using (auth.uid() = user_id);
create policy "providers_insert_own" on public.providers for insert with check (auth.uid() = user_id);
create policy "providers_update_own" on public.providers for update using (auth.uid() = user_id);
create policy "providers_delete_own" on public.providers for delete using (auth.uid() = user_id);
