-- The public request API invokes this RPC only through the server-side service role.
revoke all on function public.create_journey_request(text,text,text,text,text,text,text,integer,date,date,date,text,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.create_journey_request(text,text,text,text,text,text,text,integer,date,date,date,text,text,text,text,uuid) to service_role;
