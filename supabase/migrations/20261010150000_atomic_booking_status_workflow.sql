-- Make booking lifecycle changes atomic and enforce the state machine on the server.
create or replace function public.update_booking_status_atomic(
  p_booking_id uuid,
  p_staff_id uuid,
  p_status text,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking public.bookings%rowtype;
  v_after public.bookings%rowtype;
  v_role app_role;
  v_group public.groups%rowtype;
  v_member_count integer;
  v_pending_ops integer;
  v_pending_host integer;
begin
  select role into v_role
  from public.profiles
  where id = p_staff_id;

  if v_role is null then
    raise exception using errcode = '42501', message = 'Staff profile not found';
  end if;

  if p_status not in ('NEW_REQUEST','CONTACTED','DETAILS_PENDING','PAYMENT_PENDING','PAYMENT_RECEIVED','CONFIRMED','PREPARING','ACTIVE','COMPLETED','CANCELLED') then
    raise exception using errcode = '22023', message = 'Invalid booking status';
  end if;

  if not (
    (v_role = 'SUPER_ADMIN'::app_role)
    or (v_role = 'SALES'::app_role and p_status in ('CONTACTED','DETAILS_PENDING','PAYMENT_PENDING','CANCELLED'))
    or (v_role = 'OPERATIONS_MANAGER'::app_role and p_status in ('PREPARING','ACTIVE','COMPLETED','CANCELLED'))
    or (v_role = 'OPERATIONS'::app_role and p_status in ('PREPARING','ACTIVE','COMPLETED'))
  ) then
    raise exception using errcode = '42501', message = 'You do not have permission for this status';
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id and archived_at is null
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Booking not found';
  end if;

  if v_booking.status::text = p_status then
    return jsonb_build_object('booking', to_jsonb(v_booking), 'unchanged', true);
  end if;

  if p_status = 'CANCELLED' then
    if v_booking.status::text in ('COMPLETED','CANCELLED') then
      raise exception using errcode = '23514', message = 'Completed or cancelled bookings are terminal';
    end if;
    if v_booking.status::text = 'ACTIVE' and v_role <> 'SUPER_ADMIN'::app_role then
      raise exception using errcode = '42501', message = 'Only the Super Admin may cancel an active journey';
    end if;
  else
    if not (
      (v_booking.status::text = 'NEW_REQUEST' and p_status in ('CONTACTED','DETAILS_PENDING','PAYMENT_PENDING'))
      or (v_booking.status::text = 'CONTACTED' and p_status in ('DETAILS_PENDING','PAYMENT_PENDING'))
      or (v_booking.status::text = 'DETAILS_PENDING' and p_status in ('CONTACTED','PAYMENT_PENDING'))
      or (v_booking.status::text = 'PAYMENT_PENDING' and p_status = 'PAYMENT_RECEIVED')
      or (v_booking.status::text = 'PAYMENT_RECEIVED' and p_status = 'CONFIRMED')
      or (v_booking.status::text = 'CONFIRMED' and p_status = 'PREPARING')
      or (v_booking.status::text = 'PREPARING' and p_status = 'ACTIVE')
      or (v_booking.status::text = 'ACTIVE' and p_status = 'COMPLETED')
    ) then
      raise exception using errcode = '23514', message = 'Invalid booking status transition';
    end if;
  end if;

  if p_status in ('PAYMENT_RECEIVED','CONFIRMED','PREPARING','ACTIVE','COMPLETED')
     and v_booking.payment_status <> 'RECEIVED'::payment_status then
    raise exception using errcode = '23514', message = 'Payment must be fully received before this status';
  end if;

  if p_status in ('PREPARING','ACTIVE','COMPLETED') then
    select count(*) into v_member_count
    from public.group_members gm
    where gm.booking_id = v_booking.id;

    if v_member_count <> 1 then
      raise exception using errcode = '23514', message = 'Booking must belong to exactly one approved group before preparation';
    end if;
  end if;

  if p_status = 'ACTIVE' then
    select g.* into v_group
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    where gm.booking_id = v_booking.id
    limit 1;

    if v_group.host_id is null or v_group.hotel_makkah_id is null or v_group.hotel_madinah_id is null then
      raise exception using errcode = '23514', message = 'Assign the host and Makkah and Madinah hotels before starting the journey';
    end if;
  end if;

  if p_status = 'COMPLETED' then
    select count(*) into v_pending_ops
    from public.operations_tasks ot
    join public.group_members gm on gm.group_id = ot.group_id
    where gm.booking_id = v_booking.id
      and ot.status::text not in ('COMPLETED','CANCELLED');

    select count(*) into v_pending_host
    from public.host_tasks ht
    join public.group_members gm on gm.group_id = ht.group_id
    where gm.booking_id = v_booking.id
      and ht.status::text not in ('COMPLETED','CANCELLED');

    if v_pending_ops > 0 or v_pending_host > 0 then
      raise exception using errcode = '23514', message = 'All operations and host tasks must be completed or cancelled before closing the journey';
    end if;
  end if;

  update public.bookings
  set status = p_status::booking_status,
      notes = case when p_notes is null then notes else left(p_notes, 4000) end,
      updated_at = now()
  where id = v_booking.id
  returning * into v_after;

  if v_booking.request_id is not null then
    update public.journey_requests
    set status = p_status,
        updated_at = now()
    where id = v_booking.request_id;
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, before_data, after_data
  ) values (
    p_staff_id, 'BOOKING_STATUS_UPDATED', 'booking', v_booking.id, to_jsonb(v_booking), to_jsonb(v_after)
  );

  return jsonb_build_object('booking', to_jsonb(v_after), 'unchanged', false);
end;
$$;

revoke all on function public.update_booking_status_atomic(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.update_booking_status_atomic(uuid, uuid, text, text) to service_role;
