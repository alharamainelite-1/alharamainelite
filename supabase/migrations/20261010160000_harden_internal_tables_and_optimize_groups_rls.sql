REVOKE ALL PRIVILEGES ON TABLE public.journey_confirmation_documents FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.journey_request_idempotency FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.review_invitations FROM anon, authenticated;

DROP POLICY IF EXISTS operations_groups_select ON public.groups;
CREATE POLICY operations_groups_select
ON public.groups
FOR SELECT
TO authenticated
USING (
  (has_role('OPERATIONS'::app_role) AND operations_coordinator_id = (SELECT auth.uid()))
  OR has_role('OPERATIONS_MANAGER'::app_role)
  OR has_role('SUPER_ADMIN'::app_role)
);
