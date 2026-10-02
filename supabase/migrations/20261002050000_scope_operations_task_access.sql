-- Restrict direct authenticated access to operational records.
-- Hosts may read only their own profile/tasks. All writes go through server routes
-- which authenticate staff and validate assignment/status transitions.
DROP POLICY IF EXISTS operations_host_tasks ON public.host_tasks;
DROP POLICY IF EXISTS host_tasks_role_scoped ON public.host_tasks;
CREATE POLICY host_tasks_management_all ON public.host_tasks
  FOR ALL TO authenticated
  USING (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR has_role('OPERATIONS'::app_role))
  WITH CHECK (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR has_role('OPERATIONS'::app_role));
CREATE POLICY host_tasks_host_read ON public.host_tasks
  FOR SELECT TO authenticated
  USING (has_role('HOST'::app_role) AND EXISTS (
    SELECT 1 FROM public.hosts h WHERE h.id=host_tasks.host_id AND h.user_id=auth.uid()
  ));

DROP POLICY IF EXISTS operations_hosts ON public.hosts;
DROP POLICY IF EXISTS hosts_role_scoped ON public.hosts;
CREATE POLICY hosts_management_all ON public.hosts
  FOR ALL TO authenticated
  USING (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR has_role('OPERATIONS'::app_role))
  WITH CHECK (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR has_role('OPERATIONS'::app_role));
CREATE POLICY hosts_host_read ON public.hosts
  FOR SELECT TO authenticated
  USING (has_role('HOST'::app_role) AND user_id=auth.uid());

DROP POLICY IF EXISTS operations_tasks ON public.operations_tasks;
DROP POLICY IF EXISTS operations_tasks_role_scoped ON public.operations_tasks;
CREATE POLICY operations_tasks_management_all ON public.operations_tasks
  FOR ALL TO authenticated
  USING (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role))
  WITH CHECK (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role));
CREATE POLICY operations_tasks_assigned_staff_read ON public.operations_tasks
  FOR SELECT TO authenticated
  USING (has_role('OPERATIONS'::app_role) AND assigned_staff_id=auth.uid());
CREATE POLICY operations_tasks_assigned_host_read ON public.operations_tasks
  FOR SELECT TO authenticated
  USING (has_role('HOST'::app_role) AND EXISTS (
    SELECT 1 FROM public.hosts h WHERE h.id=operations_tasks.assigned_host AND h.user_id=auth.uid()
  ));

REVOKE INSERT, UPDATE, DELETE ON TABLE public.host_tasks FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.hosts FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.operations_tasks FROM anon, authenticated;
