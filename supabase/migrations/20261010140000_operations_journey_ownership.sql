-- Operations ownership and scoped expense entry for ALHARAMAIN ELITE
alter table public.groups
  add column if not exists operations_coordinator_id uuid references public.profiles(id) on delete set null;

create index if not exists groups_operations_coordinator_id_idx
  on public.groups (operations_coordinator_id);

comment on column public.groups.operations_coordinator_id is
  'Primary operations coordinator responsible for the group journey; financial aggregates remain restricted to management/finance.';

