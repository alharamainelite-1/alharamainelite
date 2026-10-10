-- Index the cancellation actor foreign key for audit-history joins and staff lookups.
CREATE INDEX IF NOT EXISTS operations_tasks_cancelled_by_idx
  ON public.operations_tasks (cancelled_by);
