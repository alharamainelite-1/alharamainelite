-- Align direct Supabase reads with the staff hierarchy.
-- Keep all writes behind the existing server-side API; these policies only govern SELECT.
DROP POLICY IF EXISTS operations_groups_select ON public.groups;
CREATE POLICY operations_groups_select ON public.groups
FOR SELECT TO authenticated
USING (
  (public.has_role('JOURNEY_COORDINATOR'::public.app_role) AND operations_coordinator_id = (SELECT auth.uid()))
  OR (public.has_role('OPERATIONS'::public.app_role) AND operations_coordinator_id = (SELECT auth.uid()))
  OR public.has_role('OPERATIONS_SUPERVISOR'::public.app_role)
  OR public.has_role('OPERATIONS_MANAGER'::public.app_role)
  OR public.has_role('SUPER_ADMIN'::public.app_role)
);

DROP POLICY IF EXISTS operations_tasks_read ON public.operations_tasks;
CREATE POLICY operations_tasks_read ON public.operations_tasks
FOR SELECT TO authenticated
USING (
  (
    public.has_role('HOST'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.hosts h
      WHERE h.id = operations_tasks.assigned_host
        AND h.user_id = (SELECT auth.uid())
    )
  )
  OR (
    public.has_role('OPERATIONS'::public.app_role)
    AND assigned_staff_id = (SELECT auth.uid())
  )
  OR (
    public.has_role('JOURNEY_COORDINATOR'::public.app_role)
    AND group_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = operations_tasks.group_id
        AND g.operations_coordinator_id = (SELECT auth.uid())
    )
  )
  OR public.has_role('OPERATIONS_SUPERVISOR'::public.app_role)
  OR public.has_role('OPERATIONS_MANAGER'::public.app_role)
  OR public.has_role('SUPER_ADMIN'::public.app_role)
);

DROP POLICY IF EXISTS host_tasks_read ON public.host_tasks;
CREATE POLICY host_tasks_read ON public.host_tasks
FOR SELECT TO authenticated
USING (
  (
    public.has_role('HOST'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.hosts h
      WHERE h.id = host_tasks.host_id
        AND h.user_id = (SELECT auth.uid())
    )
  )
  OR (
    public.has_role('JOURNEY_COORDINATOR'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = host_tasks.group_id
        AND g.operations_coordinator_id = (SELECT auth.uid())
    )
  )
  OR public.has_role('OPERATIONS_SUPERVISOR'::public.app_role)
  OR public.has_role('OPERATIONS_MANAGER'::public.app_role)
  OR public.has_role('OPERATIONS'::public.app_role)
  OR public.has_role('SUPER_ADMIN'::public.app_role)
);

DROP POLICY IF EXISTS hosts_read ON public.hosts;
CREATE POLICY hosts_read ON public.hosts
FOR SELECT TO authenticated
USING (
  (public.has_role('HOST'::public.app_role) AND user_id = (SELECT auth.uid()))
  OR (
    public.has_role('JOURNEY_COORDINATOR'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.host_id = hosts.id
        AND g.operations_coordinator_id = (SELECT auth.uid())
    )
  )
  OR public.has_role('OPERATIONS_SUPERVISOR'::public.app_role)
  OR public.has_role('OPERATIONS_MANAGER'::public.app_role)
  OR public.has_role('OPERATIONS'::public.app_role)
  OR public.has_role('SUPER_ADMIN'::public.app_role)
);

DROP POLICY IF EXISTS "staff can read task slas" ON public.operations_task_slas;
CREATE POLICY "staff can read task slas" ON public.operations_task_slas
FOR SELECT TO authenticated
USING (
  public.has_role('SUPER_ADMIN'::public.app_role)
  OR public.has_role('OPERATIONS_MANAGER'::public.app_role)
  OR public.has_role('OPERATIONS_SUPERVISOR'::public.app_role)
  OR public.has_role('JOURNEY_COORDINATOR'::public.app_role)
  OR public.has_role('OPERATIONS'::public.app_role)
);
