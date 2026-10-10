-- Atomically update a payment record and synchronize the booking's paid state.
create or replace function public.update_payment_status_atomic(
  p_payment_id uuid,
  p_staff_id uuid,
  p_status text,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_before public.payments%rowtype;
  v_booking public.bookings%rowtype;
  v_after_booking public.bookings%rowtype;
  v_received numeric(12,2);
  v_status payment_status;
  v_booking_payment_status payment_status;
  v_booking_status booking_status;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_staff_id and role in ('SUPER_ADMIN'::app_role, 'FINANCE'::app_role)
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

  v_status := p_status::payment_status;

  update public.payments
  set status = v_status,
      verified_by = case when v_status = 'RECEIVED'::payment_status then p_staff_id else null end,
      verified_at = case when v_status = 'RECEIVED'::payment_status then now() else null end,
      notes = case when p_notes is null then notes else left(p_notes, 4000) end
  where id = p_payment_id
  returning * into v_payment;

  select coalesce(sum(amount), 0) into v_received
  from public.payments
  where booking_id = v_booking.id and status = 'RECEIVED'::payment_status;

  if v_received >= v_booking.total_amount then
    v_booking_payment_status := 'RECEIVED'::payment_status;
    if v_booking.status::text in ('PAYMENT_PENDING','PAYMENT_RECEIVED') then
      v_booking_status := 'PAYMENT_RECEIVED'::booking_status;
    else
      v_booking_status := v_booking.status;
    end if;
  elsif v_received > 0 then
    v_booking_payment_status := 'PARTIALLY_RECEIVED'::payment_status;
    v_booking_status := v_booking.status;
  elsif v_status = 'REFUNDED'::payment_status then
    v_booking_payment_status := 'REFUNDED'::payment_status;
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
$$;

revoke all on function public.update_payment_status_atomic(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.update_payment_status_atomic(uuid, uuid, text, text) to service_role;
