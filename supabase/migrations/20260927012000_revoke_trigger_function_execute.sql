-- Lock internal trigger-only functions so they cannot be invoked through PostgREST by public roles.
revoke execute on function public.set_booking_group_matching_status() from anon, authenticated, public;
revoke execute on function public.sync_booking_group_matching_status() from anon, authenticated, public;
