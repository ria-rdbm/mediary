-- Security hardening: these RPCs are already granted to `authenticated`
-- only by the migrations that created them (0009, 0011, 0014, 0015), but
-- none of them explicitly revoked from `anon` — only from the generic
-- PUBLIC pseudo-role, which does not cover the `anon` role Supabase grants
-- function EXECUTE to by default. None of these functions are SECURITY
-- DEFINER, so RLS already blocks an anon caller (auth.uid() is null) from
-- touching another user's rows either way — this closes the gap so the
-- grants actually match the stated intent, rather than relying on that as
-- the only line of defense.

revoke execute on function public._stock_deduct(uuid, numeric, text, text, uuid, text) from anon;
revoke execute on function public._stock_reverse_for_record(uuid) from anon;
revoke execute on function public.log_treatment_record(
  uuid, boolean, text, timestamptz, integer, numeric, text, text, text, text, text, text, numeric
) from anon;
revoke execute on function public.update_treatment_record(
  uuid, uuid, boolean, text, timestamptz, integer, numeric, text, text, text, text, text, text, numeric
) from anon;
revoke execute on function public.delete_treatment_record(uuid) from anon;
revoke execute on function public.record_stock_usage(uuid, numeric, boolean) from anon;
revoke execute on function public.add_stock_batch(uuid, numeric, text, text, date, text, text) from anon;
revoke execute on function public.manual_stock_adjustment(uuid, numeric) from anon;
revoke execute on function public.delete_stock_transaction(uuid) from anon;
revoke execute on function public.discard_stock_batch(uuid) from anon;
