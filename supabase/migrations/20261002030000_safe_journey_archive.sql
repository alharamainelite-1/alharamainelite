alter table public.bookings add column if not exists archived_at timestamptz, add column if not exists archived_by uuid references public.profiles(id) on delete set null, add column if not exists archive_reason text;
create index if not exists bookings_archived_created_idx on public.bookings(archived_at,created_at desc);
create or replace function public.admin_archive_booking_atomic(p_booking_id uuid,p_staff_id uuid,p_action text,p_reason text default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare b public.bookings%rowtype;
begin
 if p_action not in ('ARCHIVE','RESTORE') then raise exception 'Invalid archive action' using errcode='22023'; end if;
 if not exists(select 1 from public.profiles where id=p_staff_id and role='SUPER_ADMIN') then raise exception 'Super admin access required' using errcode='42501'; end if;
 select * into b from public.bookings where id=p_booking_id for update;
 if not found then raise exception 'Booking not found' using errcode='P0002'; end if;
 if p_action='RESTORE' then
  if b.archived_at is null then raise exception 'Booking is not archived' using errcode='22023'; end if;
  update public.bookings set archived_at=null,archived_by=null,archive_reason=null,updated_at=now() where id=p_booking_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data) values(p_staff_id,'BOOKING_RESTORED','booking',p_booking_id,jsonb_build_object('archived_at',b.archived_at),jsonb_build_object('archived_at',null));
  return jsonb_build_object('ok',true,'action',p_action);
 end if;
 if b.archived_at is not null then raise exception 'Booking already archived' using errcode='22023'; end if;
 if b.status not in ('NEW_REQUEST','CONTACTED','DETAILS_PENDING','CANCELLED') then raise exception 'Only unconfirmed or cancelled journeys can be archived' using errcode='23514'; end if;
 if exists(select 1 from public.payments where booking_id=p_booking_id) or exists(select 1 from public.influencer_commissions where booking_id=p_booking_id) or exists(select 1 from public.expenses where booking_id=p_booking_id) or exists(select 1 from public.host_tasks where booking_id=p_booking_id) or exists(select 1 from public.communication_logs where booking_id=p_booking_id) or exists(select 1 from public.journey_costs where booking_id=p_booking_id) or exists(select 1 from public.booking_activities where booking_id=p_booking_id) or exists(select 1 from public.group_members where booking_id=p_booking_id) then raise exception 'Journey has financial or operational records and cannot be archived' using errcode='23514'; end if;
 if coalesce(length(trim(p_reason)),0)<3 then raise exception 'Please provide an archive reason' using errcode='22023'; end if;
 update public.bookings set archived_at=now(),archived_by=p_staff_id,archive_reason=left(trim(p_reason),500),updated_at=now() where id=p_booking_id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data) values(p_staff_id,'BOOKING_ARCHIVED','booking',p_booking_id,jsonb_build_object('booking_id',b.booking_id,'status',b.status),jsonb_build_object('archived_at',now(),'reason',left(trim(p_reason),500)));
 return jsonb_build_object('ok',true,'action',p_action);
end;$$;
revoke all on function public.admin_archive_booking_atomic(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.admin_archive_booking_atomic(uuid,uuid,text,text) to service_role;