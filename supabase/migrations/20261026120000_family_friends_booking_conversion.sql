-- Atomic, idempotent conversion of a confirmed custom private quote into a booking.
alter table public.bookings
  add column if not exists family_friends_request_id uuid
    references public.family_friends_quote_requests(id) on delete restrict;
create unique index if not exists bookings_family_friends_request_id_uidx
  on public.bookings(family_friends_request_id) where family_friends_request_id is not null;
alter table public.family_friends_quote_requests
  add column if not exists booking_id uuid references public.bookings(id) on delete restrict;
create unique index if not exists family_friends_quote_booking_id_uidx
  on public.family_friends_quote_requests(booking_id) where booking_id is not null;

create or replace function public.convert_family_friends_quote_to_booking(
  p_request_id uuid,
  p_actor_id uuid
) returns table(booking_uuid uuid, booking_code text, already_converted boolean)
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  q public.family_friends_quote_requests%rowtype;
  v_package_id uuid;
  v_customer_id uuid;
  v_booking_id uuid;
  v_booking_code text;
  v_guest_count integer;
begin
  if p_request_id is null or p_actor_id is null then
    raise exception 'Request and actor are required' using errcode='22023';
  end if;
  select * into q from public.family_friends_quote_requests where id=p_request_id for update;
  if not found then raise exception 'Quote request not found' using errcode='P0002'; end if;
  if q.booking_id is not null then
    select b.id,b.booking_id into v_booking_id,v_booking_code from public.bookings b where b.id=q.booking_id;
    return query select v_booking_id,v_booking_code,true; return;
  end if;
  if q.status <> 'CONFIRMED' then raise exception 'Request must be CONFIRMED' using errcode='22023'; end if;
  if q.quote_amount is null or q.quote_amount <= 0 then raise exception 'Positive approved quote required' using errcode='22023'; end if;

  -- Internal inactive package satisfies the existing booking FK; it is not a customer-facing offer.
  select id into v_package_id from public.packages where slug='family-friends-private-custom' limit 1;
  if v_package_id is null then
    insert into public.packages(slug,name,price,currency,positioning,active)
    values('family-friends-private-custom','Family & Friends — Custom Private Journey',0,q.quote_currency,'PRIVATE_CUSTOM',false)
    returning id into v_package_id;
  end if;

  v_guest_count := q.adults + coalesce(array_length(q.children_ages,1),0) + coalesce(array_length(q.infant_ages_months,1),0);
  if v_guest_count < 1 or v_guest_count > 100 then raise exception 'Guest count outside supported limits' using errcode='22023'; end if;

  select id into v_customer_id from public.customers where whatsapp=q.phone limit 1;
  if v_customer_id is null then
    insert into public.customers(full_name,whatsapp,email,country,preferred_language)
    values(q.full_name,q.phone,q.email,q.country,q.preferred_language) returning id into v_customer_id;
  end if;

  v_booking_code := 'HE-' || extract(year from now())::text || '-FF' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.bookings(
    booking_id,family_friends_request_id,customer_id,package_id,guest_count,total_amount,currency,
    status,payment_status,expected_travel_date,notes,lead_source,group_matching_status
  ) values (
    v_booking_code,q.id,v_customer_id,v_package_id,v_guest_count,q.quote_amount,q.quote_currency,
    'NEW_REQUEST','NOT_REQUESTED',q.expected_travel_date,
    '[FAMILY & FRIENDS] Source request: '||q.reference||E'\nConverted by staff: '||p_actor_id::text||
    E'\nPrivate custom journey. Do not automatically match with shared groups.'||
    case when nullif(trim(q.notes),'') is not null then E'\nCustomer notes: '||q.notes else '' end,
    'OTHER','PRIVATE_JOURNEY'
  ) returning id into v_booking_id;

  insert into public.booking_travel_admin(booking_id,updated_by,internal_notes)
  values(v_booking_id,p_actor_id,'Private Family & Friends journey. Price agreed in quote request. Do not automatically match with other groups.');

  update public.family_friends_quote_requests set booking_id=v_booking_id,updated_at=now() where id=q.id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
  values(p_actor_id,'FAMILY_FRIENDS_REQUEST_CONVERTED','family_friends_quote_request',q.id,to_jsonb(q),
    jsonb_build_object('request_id',q.id,'reference',q.reference,'booking_id',v_booking_id,'booking_code',v_booking_code,'package_id',v_package_id,'guest_count',v_guest_count,'amount',q.quote_amount,'currency',q.quote_currency));
  return query select v_booking_id,v_booking_code,false;
end;
$$;
revoke all on function public.convert_family_friends_quote_to_booking(uuid,uuid) from public,anon,authenticated;
grant execute on function public.convert_family_friends_quote_to_booking(uuid,uuid) to service_role;
