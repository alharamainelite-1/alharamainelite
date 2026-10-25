-- Private journeys use a dedicated operations record, not shared-group membership.
alter table public.bookings
  add column if not exists private_group_id uuid references public.groups(id) on delete set null;
create index if not exists bookings_private_group_id_idx
  on public.bookings(private_group_id) where private_group_id is not null;

create or replace function public.update_booking_status_atomic(
  p_booking_id uuid, p_staff_id uuid, p_status text, p_notes text default null
) returns jsonb
language plpgsql security definer set search_path to 'public', 'pg_temp'
as $function$
declare
  v_booking public.bookings%rowtype;
  v_after public.bookings%rowtype;
  v_role app_role;
  v_group public.groups%rowtype;
  v_group_id uuid;
  v_member_count integer;
  v_pending_ops integer;
  v_pending_host integer;
  v_private boolean;
begin
  select role into v_role from public.profiles where id=p_staff_id;
  if v_role is null then raise exception using errcode='42501', message='Staff profile not found'; end if;
  if p_status not in ('NEW_REQUEST','CONTACTED','DETAILS_PENDING','PAYMENT_PENDING','PAYMENT_RECEIVED','CONFIRMED','PREPARING','ACTIVE','COMPLETED','CANCELLED') then
    raise exception using errcode='22023', message='Invalid booking status';
  end if;
  if not (
    v_role='SUPER_ADMIN'::app_role
    or (v_role='SALES'::app_role and p_status in ('CONTACTED','DETAILS_PENDING','PAYMENT_PENDING','CANCELLED'))
    or (v_role='OPERATIONS_MANAGER'::app_role and p_status in ('PREPARING','ACTIVE','COMPLETED','CANCELLED'))
    or (v_role='OPERATIONS'::app_role and p_status in ('PREPARING','ACTIVE','COMPLETED'))
  ) then raise exception using errcode='42501', message='You do not have permission for this status'; end if;

  select * into v_booking from public.bookings where id=p_booking_id and archived_at is null for update;
  if not found then raise exception using errcode='P0002', message='Booking not found'; end if;
  if v_booking.status::text=p_status then return jsonb_build_object('booking',to_jsonb(v_booking),'unchanged',true); end if;
  v_private := coalesce(v_booking.group_matching_status::text='PRIVATE_JOURNEY',false);

  if p_status='CANCELLED' then
    if v_booking.status::text in ('COMPLETED','CANCELLED') then raise exception using errcode='23514', message='Completed or cancelled bookings are terminal'; end if;
    if v_booking.status::text='ACTIVE' and v_role<>'SUPER_ADMIN'::app_role then raise exception using errcode='42501', message='Only the Super Admin may cancel an active journey'; end if;
  else
    if not (
      (v_booking.status::text='NEW_REQUEST' and p_status in ('CONTACTED','DETAILS_PENDING','PAYMENT_PENDING'))
      or (v_booking.status::text='CONTACTED' and p_status in ('DETAILS_PENDING','PAYMENT_PENDING'))
      or (v_booking.status::text='DETAILS_PENDING' and p_status in ('CONTACTED','PAYMENT_PENDING'))
      or (v_booking.status::text='PAYMENT_PENDING' and p_status='PAYMENT_RECEIVED')
      or (v_booking.status::text='PAYMENT_RECEIVED' and p_status='CONFIRMED')
      or (v_booking.status::text='CONFIRMED' and p_status='PREPARING')
      or (v_booking.status::text='PREPARING' and p_status='ACTIVE')
      or (v_booking.status::text='ACTIVE' and p_status='COMPLETED')
    ) then raise exception using errcode='23514', message='Invalid booking status transition'; end if;
  end if;

  if p_status in ('PAYMENT_RECEIVED','CONFIRMED','PREPARING','ACTIVE','COMPLETED')
    and v_booking.payment_status<>'RECEIVED'::payment_status then
    raise exception using errcode='23514', message='Payment must be fully received before this status';
  end if;

  if p_status in ('PREPARING','ACTIVE','COMPLETED') then
    select count(*) into v_member_count from public.group_members gm where gm.booking_id=v_booking.id;
    if not v_private and v_member_count<>1 then
      raise exception using errcode='23514', message='Booking must belong to exactly one approved group before preparation';
    end if;
  end if;

  if p_status in ('ACTIVE','COMPLETED') then
    v_group_id:=v_booking.private_group_id;
    if v_group_id is null then
      select gm.group_id into v_group_id from public.group_members gm where gm.booking_id=v_booking.id limit 1;
    end if;
    if v_group_id is null then
      if v_private then
        raise exception using errcode='23514', message='Private journey operations record is missing. Assign its host and Makkah/Madinah hotels in a private operations record; shared-group membership is not required.';
      else
        raise exception using errcode='23514', message='Group assignment is required before starting or completing the journey';
      end if;
    end if;
    select * into v_group from public.groups where id=v_group_id;
    if not found then raise exception using errcode='23514', message='Journey operations group record was not found'; end if;
    if p_status='ACTIVE' and (v_group.host_id is null or v_group.hotel_makkah_id is null or v_group.hotel_madinah_id is null) then
      raise exception using errcode='23514', message=case when v_private
        then 'Assign the private journey host and Makkah/Madinah hotels before starting. No shared group is required.'
        else 'Assign the host and Makkah and Madinah hotels before starting the journey' end;
    end if;
  end if;

  if p_status='COMPLETED' then
    select count(*) into v_pending_ops from public.operations_tasks ot
      where ot.group_id=v_group_id and ot.status::text not in ('COMPLETED','CANCELLED');
    select count(*) into v_pending_host from public.host_tasks ht
      where (ht.group_id=v_group_id or ht.booking_id=v_booking.id)
        and ht.status::text not in ('COMPLETED','CANCELLED');
    if v_pending_ops>0 or v_pending_host>0 then
      raise exception using errcode='23514', message='All operations and host tasks must be completed or cancelled before closing the journey';
    end if;
  end if;

  update public.bookings set status=p_status::booking_status,
    notes=case when p_notes is null then notes else left(p_notes,4000) end, updated_at=now()
    where id=v_booking.id returning * into v_after;
  if v_booking.request_id is not null then
    update public.journey_requests set status=p_status::booking_status,updated_at=now() where id=v_booking.request_id;
  end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
    values(p_staff_id,'BOOKING_STATUS_UPDATED','booking',v_booking.id,to_jsonb(v_booking),to_jsonb(v_after));
  return jsonb_build_object('booking',to_jsonb(v_after),'unchanged',false);
end;
$function$;
