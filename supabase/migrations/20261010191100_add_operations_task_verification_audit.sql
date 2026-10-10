ALTER TABLE public.operations_tasks
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS operations_tasks_verified_by_idx ON public.operations_tasks(verified_by);
CREATE INDEX IF NOT EXISTS operations_tasks_closed_by_idx ON public.operations_tasks(closed_by);
