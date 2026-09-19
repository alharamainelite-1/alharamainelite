drop policy if exists profiles_admin_manage on public.profiles;
drop policy if exists profiles_self_or_admin on public.profiles;

create policy profiles_select_self_or_admin
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select has_role('ADMIN'::app_role))
);

create policy profiles_admin_insert
on public.profiles
for insert
to authenticated
with check ((select has_role('ADMIN'::app_role)));

create policy profiles_admin_update
on public.profiles
for update
to authenticated
using ((select has_role('ADMIN'::app_role)))
with check ((select has_role('ADMIN'::app_role)));

create policy profiles_admin_delete
on public.profiles
for delete
to authenticated
using ((select has_role('ADMIN'::app_role)));
