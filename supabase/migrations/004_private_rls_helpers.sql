-- Keep RLS helper functions out of the exposed public API.
create schema if not exists private;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES','FINANCE')
  );
$$;

create or replace function private.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (p.role = required_role or p.role = 'SUPER_ADMIN')
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;

revoke all on function private.is_staff() from public, anon, authenticated;
revoke all on function private.has_role(public.app_role) from public, anon, authenticated;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.has_role(public.app_role) to authenticated;

-- Public wrappers remain callable only by signed-in staff policies and service-side code.
create or replace function public.is_staff()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select (select private.is_staff()); $$;

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select (select private.has_role(required_role)); $$;

revoke execute on function public.is_staff() from public, anon;
revoke execute on function public.has_role(public.app_role) from public, anon;
grant execute on function public.is_staff() to authenticated, service_role;
grant execute on function public.has_role(public.app_role) to authenticated, service_role;

-- The public journey endpoint is server-side only; never expose this privileged RPC to browser roles.
revoke execute on function public.create_journey_request(text,text,text,text,text,text,text,integer,date,date,date,text,text) from public, anon, authenticated;
grant execute on function public.create_journey_request(text,text,text,text,text,text,text,integer,date,date,date,text,text) to service_role;

-- Trigger-only helper must not be callable through the Data API.
revoke execute on function public.protect_profile_role() from public, anon, authenticated;
grant execute on function public.protect_profile_role() to service_role;

-- Optimize the profile RLS policy's auth lookup.
drop policy if exists profiles_self_or_admin on public.profiles;
create policy profiles_self_or_admin on public.profiles
for select using ((select auth.uid()) = id or (select public.has_role('ADMIN'::public.app_role)));

-- Prevent automatic execution grants on future public functions.
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
