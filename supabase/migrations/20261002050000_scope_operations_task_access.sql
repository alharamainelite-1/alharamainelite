-- Scope direct authenticated access to operational records.
DROP POLICY IF EXISTS operations_host_tasks ON public.host_tasks;
CREATE POLICY host_tasks_role_scoped ON public.host_tasks FOR ALL TO public
USING (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR has_role('OPERATIONS'::app_role) OR (has_role('HOST'::app_role) AND EXISTS (SELECT 1 FROM public.hosts h WHERE h.id=host_tasks.host_id AND h.user_id=auth.uid())))
WITH CHECK (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR has_role('OPERATIONS'::app_role) OR (has_role('HOST'::app_role) AND EXISTS (SELECT 1 FROM public.hosts h WHERE h.id=host_tasks.host_id AND h.user_id=auth.uid())));
DROP POLICY IF EXISTS operations_hosts ON public.hosts;
CREATE POLICY hosts_role_scoped ON public.hosts FOR ALL TO public
USING (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR has_role('OPERATIONS'::app_role) OR (has_role('HOST'::app_role) AND user_id=auth.uid()))
WITH CHECK (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR has_role('OPERATIONS'::app_role) OR (has_role('HOST'::app_role) AND user_id=auth.uid()));
DROP POLICY IF EXISTS operations_tasks ON public.operations_tasks;
CREATE POLICY operations_tasks_role_scoped ON public.operations_tasks FOR ALL TO public
USING (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR (has_role('OPERATIONS'::app_role) AND assigned_staff_id=auth.uid()) OR (has_role('HOST'::app_role) AND EXISTS (SELECT 1 FROM public.hosts h WHERE h.id=operations_tasks.assigned_host AND h.user_id=auth.uid())))
WITH CHECK (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR (has_role('OPERATIONS'::app_role) AND assigned_staff_id=auth.uid()) OR (has_role('HOST'::app_role) AND EXISTS (SELECT 1 FROM public.hosts h WHERE h.id=operations_tasks.assigned_host AND h.user_id=auth.uid())));
