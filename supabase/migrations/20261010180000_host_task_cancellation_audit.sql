-- Keep legacy host-task cancellations auditable and visible to the assigned host.
ALTER TABLE public.host_tasks
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES public.profiles(id);

ALTER TABLE public.host_tasks
  DROP CONSTRAINT IF EXISTS host_tasks_cancellation_reason_length;
ALTER TABLE public.host_tasks
  ADD CONSTRAINT host_tasks_cancellation_reason_length
  CHECK (cancellation_reason IS NULL OR length(btrim(cancellation_reason)) BETWEEN 3 AND 1000);

CREATE INDEX IF NOT EXISTS host_tasks_cancelled_by_idx
  ON public.host_tasks (cancelled_by);
