-- Harden SECURITY DEFINER routines against search_path object shadowing.
-- All relations and enum types referenced below are schema-qualified.
CREATE OR REPLACE FUNCTION public.update_payment_status_atomic(
  p_payment_id uuid,
  p_staff_id uuid,
  p_status text,
  p_notes text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_payment public.payments%rowtype;
  v_before public.payments%rowtype;
  v_booking public.bookings%rowtype;
  v_after_booking public.bookings%rowtype;
  v_received numeric(12,2);
  v_status public.payment_status;
  v_booking_payment_status public.payment_status;
  v_booking_status public.booking_status;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_staff_id and role in ('SUPER_ADMIN'::public.app_role, 'FINANCE'::public.app_role)
  ) then
    raise exception using errcode = '42501', message = 'Payment verification access required';
  end if;

  if p_status not in ('NOT_REQUESTED','PAYMENT_INSTRUCTIONS_SENT','PENDING_VERIFICATION','RECEIVED','PARTIALLY_RECEIVED','REFUNDED','FAILED') then
    raise exception using errcode = '22023', message = 'Invalid payment status';
  end if;

  select * into v_before
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Payment not found';
  end if;

  select * into v_booking
  from public.bookings
  where id = v_before.booking_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Booking not found';
  end if;

  v_status := p_status::public.payment_status;

  update public.payments
  set status = v_status,
      verified_by = case when v_status = 'RECEIVED'::public.payment_status then p_staff_id else null end,
      verified_at = case when v_status = 'RECEIVED'::public.payment_status then now() else null end,
      notes = case when p_notes is null then notes else left(p_notes, 4000) end
  where id = p_payment_id
  returning * into v_payment;

  select coalesce(sum(amount), 0) into v_received
  from public.payments
  where booking_id = v_booking.id and status = 'RECEIVED'::public.payment_status;

  if v_received >= v_booking.total_amount then
    v_booking_payment_status := 'RECEIVED'::public.payment_status;
    if v_booking.status::text in ('PAYMENT_PENDING','PAYMENT_RECEIVED') then
      v_booking_status := 'PAYMENT_RECEIVED'::public.booking_status;
    else
      v_booking_status := v_booking.status;
    end if;
  elsif v_received > 0 then
    v_booking_payment_status := 'PARTIALLY_RECEIVED'::public.payment_status;
    v_booking_status := v_booking.status;
  elsif v_status = 'REFUNDED'::public.payment_status then
    v_booking_payment_status := 'REFUNDED'::public.payment_status;
    v_booking_status := v_booking.status;
  else
    v_booking_payment_status := v_status;
    v_booking_status := v_booking.status;
  end if;

  update public.bookings
  set payment_status = v_booking_payment_status,
      status = v_booking_status,
      updated_at = now()
  where id = v_booking.id
  returning * into v_after_booking;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values
    (p_staff_id, 'PAYMENT_STATUS_UPDATED', 'payment', v_payment.id, to_jsonb(v_before), to_jsonb(v_payment)),
    (p_staff_id, 'BOOKING_PAYMENT_STATUS_SYNCED', 'booking', v_after_booking.id, to_jsonb(v_booking), to_jsonb(v_after_booking));

  return jsonb_build_object(
    'payment', to_jsonb(v_payment),
    'booking', to_jsonb(v_after_booking),
    'received_total', v_received,
    'fully_paid', v_received >= v_booking.total_amount
  );
end;
$function$;

-- This trigger is server-owned and only uses explicitly qualified objects.
CREATE OR REPLACE FUNCTION public.create_influencer_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
begin
  if new.payment_status = 'RECEIVED'
     and coalesce(old.payment_status, 'NOT_REQUESTED') <> 'RECEIVED'
     and new.influencer_partner_id is not null
     and not exists (
       select 1
       from public.influencer_commissions c
       where c.booking_id = new.id
         and c.type = 'COMMISSION'
         and c.status in ('PENDING','PAID')
         and not exists (
           select 1
           from public.influencer_commissions r
           where r.type = 'RECOVERY'
             and r.related_commission_id = c.id
         )
     )
  then
    insert into public.influencer_commissions(
      partner_id, booking_id, type, amount, available_at
    )
    values(
      new.influencer_partner_id, new.id, 'COMMISSION',
      round(new.total_amount * 0.05, 2), now() + interval '24 hours'
    );
  end if;
  return new;
end;
$function$;

-- Keep direct execution limited to the trusted backend role.
REVOKE ALL ON FUNCTION public.update_payment_status_atomic(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_status_atomic(uuid, uuid, text, text) TO service_role;
REVOKE ALL ON FUNCTION public.create_influencer_commission() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_influencer_commission() TO service_role;
