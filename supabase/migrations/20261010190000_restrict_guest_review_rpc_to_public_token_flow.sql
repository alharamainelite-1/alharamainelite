-- The public review submission route uses the anon server client and a one-time,
-- hashed invitation token. Signed-in users do not need direct RPC execution.
REVOKE EXECUTE ON FUNCTION public.submit_guest_review(text, text, jsonb, text, text, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.submit_guest_review(text, text, jsonb, text, text, boolean) TO anon;
