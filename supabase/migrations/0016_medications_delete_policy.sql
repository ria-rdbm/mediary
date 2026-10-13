-- Medications had no DELETE policy, so deletes were silently filtered by RLS.
-- Owners may now delete their own medications. Foreign keys with ON DELETE
-- RESTRICT (records, stock) still block deleting anything that has history;
-- reminders cascade and symptoms/notes/appointments keep their rows with the
-- medication link cleared.
create policy "medications_delete_own" on public.medications
  for delete using (auth.uid() = user_id);
