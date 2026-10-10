-- General staff task ownership and auditable handover workflow.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'BOOKINGS';

CREATE TABLE IF NOT EXISTS public.staff_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_code text UNIQUE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 180),
  description text,
  department text NOT NULL,
  priority text NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
  status text NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED','ACCEPTED','IN_PROGRESS','COMPLETED','CANCELLED')),
  assigned_staff_id uuid NOT NULL REFERENCES public.profiles(id),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  due_at timestamptz,
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  completed_note text,
  handover_status text NOT NULL DEFAULT 'NONE' CHECK (handover_status IN ('NONE','PENDING','ACCEPTED','REJECTED')),
  handover_from_staff_id uuid REFERENCES public.profiles(id),
  handover_to_staff_id uuid REFERENCES public.profiles(id),
  handover_note text,
  handover_requested_at timestamptz,
  handover_decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (handover_to_staff_id IS NULL OR handover_to_staff_id <> assigned_staff_id)
);

CREATE INDEX IF NOT EXISTS staff_tasks_assigned_status_idx ON public.staff_tasks(assigned_staff_id,status,due_at);
CREATE INDEX IF NOT EXISTS staff_tasks_created_by_idx ON public.staff_tasks(created_by,created_at DESC);
CREATE INDEX IF NOT EXISTS staff_tasks_handover_to_idx ON public.staff_tasks(handover_to_staff_id,handover_status);
CREATE INDEX IF NOT EXISTS staff_tasks_department_idx ON public.staff_tasks(department,status);

ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY;

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
      AND p.role::text IN ('SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR')
  )
);

COMMENT ON TABLE public.staff_tasks IS 'Assigned staff work with acceptance, completion, and auditable handover.';
