-- Mediary: signup profile details.
-- full_name/gender/date_of_birth are required at signup; weight_kg,
-- nhi_number, and preferred_provider_name are optional and editable later
-- from Settings. preferred_provider_name is a free-text label rather than a
-- foreign key into `providers` (0002) — at signup the user hasn't created
-- any provider entries yet, and this field is just a personal note, not a
-- reusable appointment provider.

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists gender text check (gender in ('female', 'male', 'other', 'prefer_not_to_say')),
  add column if not exists date_of_birth date,
  add column if not exists weight_kg numeric(6, 2) check (weight_kg > 0),
  add column if not exists nhi_number text,
  add column if not exists preferred_provider_name text;
