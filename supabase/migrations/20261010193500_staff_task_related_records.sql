-- Link staff tasks and handovers to the operational record they transfer.
ALTER TABLE public.staff_tasks
  ADD COLUMN IF NOT EXISTS related_entity_type text,
  ADD COLUMN IF NOT EXISTS related_entity_id uuid;
CREATE INDEX IF NOT EXISTS staff_tasks_related_entity_idx
  ON public.staff_tasks(related_entity_type,related_entity_id)
  WHERE related_entity_id IS NOT NULL;
