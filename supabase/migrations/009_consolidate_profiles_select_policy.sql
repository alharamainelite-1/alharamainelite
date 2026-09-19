drop policy if exists profiles_self_or_admin on public.profiles;
create policy profiles_self_or_admin
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or has_role('ADMIN'::app_role)
);
