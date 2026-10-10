alter table public.operations_tasks
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.profiles(id);

alter table public.operations_tasks
  drop constraint if exists operations_tasks_cancellation_reason_length;
alter table public.operations_tasks
  add constraint operations_tasks_cancellation_reason_length
  check (cancellation_reason is null or length(btrim(cancellation_reason)) between 3 and 1000);

comment on column public.operations_tasks.cancellation_reason is 'Required explanation when an operations task is cancelled.';
