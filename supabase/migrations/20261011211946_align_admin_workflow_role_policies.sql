-- Align RLS policies with the dedicated operational bookings role already added to app_role.
alter policy "operations booking requests manager read" on public.operations_booking_requests using (
 exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','JOURNEY_COORDINATOR','OPERATIONS','OPERATIONS_BOOKINGS','BOOKINGS','FINANCE'))
);
alter policy "guest support cases authorized read" on public.guest_support_cases using (
 exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('SUPER_ADMIN','CUSTOMER_SERVICE','SALES','BOOKINGS','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','JOURNEY_COORDINATOR'))
);
