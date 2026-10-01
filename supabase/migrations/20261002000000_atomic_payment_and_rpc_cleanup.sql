-- Atomic payment verification and remove the obsolete overloaded public journey RPC.
-- Payment verification is called only by the authenticated server API using service_role.
drop function if exists public.create_journey_request(text,text,text,text,text,text,text,integer,date,date,date,text,text,text,text);

create or replace function public.verify_booking_payment_atomic(
  p_booking_id uuid,
  p_staff_id uuid,
  p_notes text default null,
  p_reference text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_payment public.payments%rowtype;
  v_remaining numeric(12,2);
  v_received numeric(12,2);
  v_commission jsonb;
  v_now timestamptz := now();
begin
  if not exists (
    select 1 from public.profiles
    where id = p_staff_id and role in ('SUPER_ADMIN','FINANCE')
  ) then
    raise exception 'Payment verification access required' using errcode='42501';
  end if;

  select * into v_booking from public.bookings where id=p_booking_id for update;
  if not found then raise exception 'Booking not found' using errcode='P0002'; end if;
  if v_booking.payment_status='RECEIVED' then
    raise exception 'Payment is already marked as received' using errcode='23505';
  end if;

  select coalesce(sum(amount),0) into v_received
  from public.payments where booking_id=v_booking.id and status='RECEIVED';
  v_remaining:=greatest(0,v_booking.total_amount-v_received);
  if v_remaining<=0 then
    raise exception 'Booking is already fully paid in payment records' using errcode='23505';
  end if;

  insert into public.payments(
    payment_id,booking_id,amount,currency,date,method,reference,status,notes,verified_by,verified_at
  ) values (
    'PAY-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)),
    v_booking.id,v_remaining,coalesce(v_booking.currency,'USD'),v_now::date,'BANK_TRANSFER',
    nullif(left(coalesce(p_reference,''),160),''),'RECEIVED',
    coalesce(nullif(left(trim(coalesce(p_notes,'')),2000),''),'Payment verified and marked received by authorized staff.'),
    p_staff_id,v_now
  ) returning * into v_payment;

  update public.bookings
  set payment_status='RECEIVED',status='PAYMENT_RECEIVED',updated_at=v_now
  where id=v_booking.id returning * into v_booking;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
  values
    (p_staff_id,'PAYMENT_MARKED_RECEIVED','payment',v_payment.id,null,to_jsonb(v_payment)),
    (p_staff_id,'BOOKING_PAYMENT_STATUS_SYNCED','booking',v_booking.id,null,to_jsonb(v_booking));

  select to_jsonb(c) into v_commission
  from public.influencer_commissions c
  where c.booking_id=v_booking.id and c.type='COMMISSION' and c.status in ('PENDING','PAID')
  order by c.created_at desc limit 1;

  return jsonb_build_object('payment',to_jsonb(v_payment),'booking',to_jsonb(v_booking),'commission',v_commission);
end;
$$;

revoke all on function public.verify_booking_payment_atomic(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.verify_booking_payment_atomic(uuid,uuid,text,text) to service_role;
