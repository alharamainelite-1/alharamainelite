-- Index the handover source FK and avoid per-row auth.uid() evaluation in the staff-task RLS policy.
CREATE INDEX IF NOT EXISTS staff_tasks_handover_from_idx ON public.staff_tasks(handover_from_staff_id);
DROP POLICY IF EXISTS staff_tasks_select_own_or_handover ON public.staff_tasks;
CREATE POLICY staff_tasks_select_own_or_handover ON public.staff_tasks
FOR SELECT TO authenticated
USING (
  assigned_staff_id = (select auth.uid())
  OR created_by = (select auth.uid())
  OR handover_to_staff_id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid())
      AND p.role::text = 'SUPER_ADMIN'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles assignee
    WHERE assignee.id = public.staff_tasks.assigned_staff_id
      AND assignee.manager_id = (select auth.uid())
  )
);
