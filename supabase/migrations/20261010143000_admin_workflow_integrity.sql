-- Enforce server-side workflow validation for group assignments and prevent
-- authenticated clients from bypassing the admin APIs with direct table writes.

drop policy if exists staff_bookings_roles on public.bookings;
create policy staff_bookings_select_roles
  on public.bookings for select to authenticated
  using (
    has_role('SALES'::app_role)
    or has_role('OPERATIONS'::app_role)
    or has_role('OPERATIONS_MANAGER'::app_role)
    or has_role('FINANCE'::app_role)
    or has_role('SUPER_ADMIN'::app_role)
  );

drop policy if exists finance_payments on public.payments;
create policy finance_payments_select
  on public.payments for select to authenticated
  using (has_role('FINANCE'::app_role) or has_role('SUPER_ADMIN'::app_role));

drop policy if exists operations_groups on public.groups;
create policy operations_groups_select
  on public.groups for select to authenticated
  using (
    has_role('OPERATIONS'::app_role)
    or has_role('OPERATIONS_MANAGER'::app_role)
    or has_role('SUPER_ADMIN'::app_role)
  );

drop policy if exists operations_group_members on public.group_members;
create policy operations_group_members_select
  on public.group_members for select to authenticated
  using (
    has_role('OPERATIONS'::app_role)
    or has_role('OPERATIONS_MANAGER'::app_role)
    or has_role('SUPER_ADMIN'::app_role)
  );

create or replace function public.assign_booking_to_group_atomic(
  p_group_id uuid,
  p_booking_id uuid,
  p_staff_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group public.groups%rowtype;
  v_booking public.bookings%rowtype;
  v_existing uuid;
  v_used integer;
  v_member public.group_members%rowtype;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_staff_id
      and role in ('SUPER_ADMIN'::app_role, 'OPERATIONS_MANAGER'::app_role)
  ) then
    raise exception using errcode = '42501', message = 'Group assignment access required';
  end if;

  select * into v_group
  from public.groups
  where id = p_group_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Group not found';
  end if;

  if v_group.status not in ('PLANNING', 'READY') then
    raise exception using errcode = '23514', message = 'Group is not open for assignments';
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id
    and archived_at is null
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Booking not found';
  end if;

  if v_booking.status <> 'CONFIRMED' then
    raise exception using errcode = '23514', message = 'Only confirmed bookings can be assigned to a group';
  end if;

  if v_booking.payment_status <> 'RECEIVED' then
    raise exception using errcode = '23514', message = 'Booking payment must be fully received before group assignment';
  end if;

  if v_booking.package_id <> v_group.package_id then
    raise exception using errcode = '23514', message = 'Booking and group packages do not match';
  end if;

  if v_group.departure_id is not null then
    if v_booking.departure_id is not null and v_booking.departure_id <> v_group.departure_id then
      raise exception using errcode = '23514', message = 'Booking and group departure dates do not match';
    end if;
    if v_booking.departure_id is null and v_booking.expected_travel_date is not null then
      if v_booking.expected_travel_date <> (select departure_date from public.departures where id = v_group.departure_id) then
        raise exception using errcode = '23514', message = 'Booking expected date does not match group departure';
      end if;
    elsif v_booking.departure_id is null and v_booking.expected_period_start is not null then
      if (select departure_date from public.departures where id = v_group.departure_id) < v_booking.expected_period_start
         or (v_booking.expected_period_end is not null and (select departure_date from public.departures where id = v_group.departure_id) > v_booking.expected_period_end) then
        raise exception using errcode = '23514', message = 'Booking travel period does not match group departure';
      end if;
    elsif v_booking.departure_id is null then
      raise exception using errcode = '23514', message = 'Booking needs a travel date or period before group assignment';
    end if;
  else
    if v_booking.expected_travel_date is null and v_booking.expected_period_start is null then
      raise exception using errcode = '23514', message = 'Booking needs a travel period before group assignment';
    end if;
    if v_group.departure_period_start is not null and coalesce(v_booking.expected_period_end, v_booking.expected_travel_date, v_booking.expected_period_start) < v_group.departure_period_start then
      raise exception using errcode = '23514', message = 'Booking travel period does not match group';
    end if;
    if v_group.departure_period_end is not null and coalesce(v_booking.expected_period_start, v_booking.expected_travel_date) > v_group.departure_period_end then
      raise exception using errcode = '23514', message = 'Booking travel period does not match group';
    end if;
  end if;

  select id into v_existing
  from public.group_members
  where booking_id = p_booking_id
  limit 1;

  if v_existing is not null then
    raise exception using errcode = '23505', message = 'Booking is already assigned to a group';
  end if;

  select coalesce(sum(guest_count), 0)::integer into v_used
  from public.group_members
  where group_id = p_group_id;

  if v_used + v_booking.guest_count > least(v_group.capacity, 8) then
    raise exception using errcode = '23514', message = 'Group capacity exceeded';
  end if;

  insert into public.group_members (
    group_id, booking_id, guest_count, approved_by, approved_at
  ) values (
    p_group_id, p_booking_id, v_booking.guest_count, p_staff_id, now()
  ) returning * into v_member;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, after_data
  ) values (
    p_staff_id, 'BOOKING_ADDED_TO_GROUP', 'group_member', v_member.id, to_jsonb(v_member)
  );

  return jsonb_build_object('member', to_jsonb(v_member));
end;
$$;

revoke all on function public.assign_booking_to_group_atomic(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.assign_booking_to_group_atomic(uuid, uuid, uuid) to service_role;
