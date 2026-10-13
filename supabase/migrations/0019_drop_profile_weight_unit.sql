-- Documents a column drop that was already applied directly to the
-- database outside of a committed migration: `profiles.weight_unit` was
-- never actually created by any committed migration (weight is always
-- stored/displayed in kg per src/lib/dateTime.ts and WeightChart.tsx), so
-- this is a no-op on every environment that matches the committed schema
-- and only guards against a stray column on an environment seeded from an
-- older, uncommitted state.

alter table public.profiles drop column if exists weight_unit;
