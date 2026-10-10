alter table public.operations_tasks
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.profiles(id) on delete set null;

alter table public.operations_tasks
  drop constraint if exists operations_tasks_cancellation_reason_check;

alter table public.operations_tasks
  add constraint operations_tasks_cancellation_reason_check
  check (cancellation_reason is null or length(trim(cancellation_reason)) between 1 and 1000);

create index if not exists operations_tasks_cancelled_at_idx
  on public.operations_tasks (cancelled_at)
  where status = 'CANCELLED';
