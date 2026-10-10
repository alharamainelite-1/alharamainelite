-- Keep journey cost records restricted to financial/owner roles.
-- Operations staff may record operational expenses through the authenticated server route,
-- but must not read cost aggregates or margin-sensitive records.
drop policy if exists journey_costs_staff_select_only on public.journey_costs;
create policy journey_costs_staff_select_only
  on public.journey_costs
  for select
  to authenticated
  using (
    public.has_role('SUPER_ADMIN'::public.app_role)
    or public.has_role('FINANCE'::public.app_role)
  );
