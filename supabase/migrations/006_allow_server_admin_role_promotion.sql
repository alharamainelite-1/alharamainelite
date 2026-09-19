-- Allow trusted server-side database administration to assign staff roles.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.role IS DISTINCT FROM OLD.role
     AND current_user <> 'postgres'
     AND coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     AND NOT public.has_role('ADMIN'::public.app_role)
  THEN
    RAISE EXCEPTION 'Only administrators may change staff roles';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_role() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protect_profile_role() TO service_role;
