-- Coordinators can read only the groups they own; managers retain team-wide visibility.
drop policy if exists operations_groups_select on public.groups;
create policy operations_groups_select
  on public.groups
  for select
  to authenticated
  using (
    (public.has_role('OPERATIONS'::public.app_role) and operations_coordinator_id = auth.uid())
    or public.has_role('OPERATIONS_MANAGER'::public.app_role)
    or public.has_role('SUPER_ADMIN'::public.app_role)
  );
