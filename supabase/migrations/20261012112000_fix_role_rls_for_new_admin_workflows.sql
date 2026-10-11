-- Align RLS policies with the dedicated operational bookings role.
drop policy if exists "operations booking requests manager read" on public.operations_booking_requests;
create policy "operations booking requests manager read" on public.operations_booking_requests for select to authenticated using (
 exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','JOURNEY_COORDINATOR','OPERATIONS','OPERATIONS_BOOKINGS','BOOKINGS','FINANCE'))
);
drop policy if exists "guest support cases authorized read" on public.guest_support_cases;
create policy "guest support cases authorized read" on public.guest_support_cases for select to authenticated using (
 exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('SUPER_ADMIN','CUSTOMER_SERVICE','SALES','BOOKINGS','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','JOURNEY_COORDINATOR'))
);
drop policy if exists "host task tokens no direct access" on public.host_task_action_tokens;
create policy "host task tokens no direct access" on public.host_task_action_tokens for all to anon, authenticated using (false) with check (false);
