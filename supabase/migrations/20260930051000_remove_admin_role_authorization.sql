-- Remove the legacy ADMIN role from application authorization.
-- SUPER_ADMIN inherits the former ADMIN policy coverage.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if tg_op='UPDATE'
     and new.role is distinct from old.role
     and current_user<>'postgres'
     and coalesce(auth.jwt()->>'role','')<>'service_role'
     and not public.has_role('SUPER_ADMIN'::public.app_role)
  then
    raise exception 'Only the Super Admin may change staff roles';
  end if;
  return new;
end;
$function$;

do $$
declare r record; roles_sql text; using_sql text; check_sql text; command_sql text; permissive_sql text;
begin
  for r in
    select pol.oid,pol.polname,pol.polrelid,pol.polcmd,pol.polpermissive,pol.polroles,
           pg_get_expr(pol.polqual,pol.polrelid) as qual,
           pg_get_expr(pol.polwithcheck,pol.polrelid) as with_check,
           c.relname as table_name,n.nspname as schema_name
    from pg_policy pol
    join pg_class c on c.oid=pol.polrelid
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public'
      and (coalesce(pg_get_expr(pol.polqual,pol.polrelid),'') like '%''ADMIN''::app_role%'
           or coalesce(pg_get_expr(pol.polwithcheck,pol.polrelid),'') like '%''ADMIN''::app_role%')
  loop
    select case
      when r.polroles = array[0::oid] then 'public'
      else coalesce(string_agg(quote_ident(gr.rolname), ', '),'public')
    end into roles_sql
    from pg_roles gr where gr.oid=any(r.polroles);

    using_sql:=replace(r.qual,'''ADMIN''::app_role','''SUPER_ADMIN''::app_role');
    check_sql:=replace(r.with_check,'''ADMIN''::app_role','''SUPER_ADMIN''::app_role');
    permissive_sql:=case when r.polpermissive then 'permissive' else 'restrictive' end;
    execute format('drop policy %I on %I.%I',r.polname,r.schema_name,r.table_name);
    command_sql:=case r.polcmd when 'r' then 'select' when 'a' then 'insert' when 'w' then 'update' when 'd' then 'delete' when '*' then 'all' else 'all' end;

    if using_sql is null and check_sql is null then
      execute format('create policy %I on %I.%I as %s for %s to %s',r.polname,r.schema_name,r.table_name,permissive_sql,command_sql,roles_sql);
    elsif using_sql is null then
      execute format('create policy %I on %I.%I as %s for %s to %s with check (%s)',r.polname,r.schema_name,r.table_name,permissive_sql,command_sql,roles_sql,check_sql);
    elsif check_sql is null then
      execute format('create policy %I on %I.%I as %s for %s to %s using (%s)',r.polname,r.schema_name,r.table_name,permissive_sql,command_sql,roles_sql,using_sql);
    else
      execute format('create policy %I on %I.%I as %s for %s to %s using (%s) with check (%s)',r.polname,r.schema_name,r.table_name,permissive_sql,command_sql,roles_sql,using_sql,check_sql);
    end if;
  end loop;
end $$;

alter table public.profiles drop constraint if exists profiles_role_no_admin;
alter table public.profiles add constraint profiles_role_no_admin check (role::text <> 'ADMIN');
