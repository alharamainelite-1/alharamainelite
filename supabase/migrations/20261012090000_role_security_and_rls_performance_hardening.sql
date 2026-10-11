-- Non-destructive hardening for the operational workflows.
-- Preserve all existing indexes; only add covering indexes for the FKs reported by Supabase.
create index if not exists guest_support_cases_created_by_idx
  on public.guest_support_cases(created_by);
create index if not exists guest_support_cases_customer_id_idx
  on public.guest_support_cases(customer_id);
create index if not exists host_task_action_tokens_created_by_idx
  on public.host_task_action_tokens(created_by);
create index if not exists operations_booking_requests_approved_by_idx
  on public.operations_booking_requests(approved_by);
create index if not exists operations_booking_requests_assigned_to_idx
  on public.operations_booking_requests(assigned_to);
create index if not exists operations_booking_requests_group_id_idx
  on public.operations_booking_requests(group_id);
create index if not exists operations_booking_requests_requested_by_idx
  on public.operations_booking_requests(requested_by);
create index if not exists staff_tasks_handover_from_staff_id_idx
  on public.staff_tasks(handover_from_staff_id);

-- Reuse the auth.uid() result per statement rather than evaluating it per row.
-- Keep the same access boundaries and role allowlists as the existing policies.
alter policy "operations booking requests manager read"
  on public.operations_booking_requests
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in (
          'SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR',
          'JOURNEY_COORDINATOR','OPERATIONS','OPERATIONS_BOOKINGS',
          'BOOKINGS','FINANCE'
        )
    )
  );

alter policy "guest support cases authorized read"
  on public.guest_support_cases
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in (
          'SUPER_ADMIN','CUSTOMER_SERVICE','SALES','BOOKINGS',
          'OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','JOURNEY_COORDINATOR'
        )
    )
  );

drop policy if exists staff_tasks_select_own_or_handover on public.staff_tasks;
create policy staff_tasks_select_own_or_handover
  on public.staff_tasks
  for select to authenticated
  using (
    assigned_staff_id = (select auth.uid())
    or created_by = (select auth.uid())
    or handover_to_staff_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role::text = 'SUPER_ADMIN'
    )
    or exists (
      select 1 from public.profiles assignee
      where assignee.id = staff_tasks.assigned_staff_id
        and assignee.manager_id = (select auth.uid())
    )
  );

-- The review RPC is intentionally public only because guests submit reviews from
-- one-time links. Remove the implicit PUBLIC grant and grant only the required role.
revoke execute on function public.submit_guest_review(text, text, jsonb, text, text, boolean) from public;
grant execute on function public.submit_guest_review(text, text, jsonb, text, text, boolean) to anon;
revoke execute on function public.submit_guest_review(text, text, jsonb, text, text, boolean) from authenticated;
alter function public.submit_guest_review(text, text, jsonb, text, text, boolean)
  set search_path = pg_catalog, public, pg_temp;

comment on function public.submit_guest_review(text, text, jsonb, text, text, boolean)
  is 'Public guest review submission via hashed, expiring, single-use invitation token; anonymous execution is intentional and must retain token/expiry/booking validation.';
