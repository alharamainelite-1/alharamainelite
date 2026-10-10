-- All staff mutations of operational/admin data must pass through guarded server APIs.
-- Keep existing role predicates for reads; remove direct authenticated table writes.
do $$
declare
  p record;
  select_policy_name text;
begin
  for p in
    select schemaname, tablename, policyname, qual
    from pg_policies
    where schemaname = 'public'
      and cmd = 'ALL'
      and roles = array['authenticated']::name[]
      and policyname <> 'api_rate_limits_no_client_access'
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    if p.qual is not null then
      select_policy_name := left(p.policyname || '_select_only', 63);
      execute format(
        'create policy %I on %I.%I for select to authenticated using (%s)',
        select_policy_name, p.schemaname, p.tablename, p.qual
      );
    end if;
  end loop;

  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
      and roles = array['authenticated']::name[]
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;
