-- Keep staff task visibility scoped to the owner, creator, recipient, direct manager, or Super Admin.
DROP POLICY IF EXISTS staff_tasks_select_own_or_handover ON public.staff_tasks;
CREATE POLICY staff_tasks_select_own_or_handover ON public.staff_tasks
FOR SELECT TO authenticated
USING (
  assigned_staff_id = auth.uid()
  OR created_by = auth.uid()
  OR handover_to_staff_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role::text = 'SUPER_ADMIN'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles assignee
    WHERE assignee.id = public.staff_tasks.assigned_staff_id
      AND assignee.manager_id = auth.uid()
  )
);
