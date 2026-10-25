-- Keep the deployed private Family & Friends conversion function reproducible in migrations.
-- Schema/link columns are introduced by the earlier family_friends_booking_conversion migration.
create or replace function public.convert_family_friends_quote_to_booking(
  p_request_id uuid,
  p_actor_id uuid
) returns table(booking_uuid uuid, booking_code text, already_converted boolean)
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  q public.family_friends_quote_requests%rowtype;
  v_customer_id uuid;
  v_booking_id uuid;
  v_booking_code text;
  v_guest_count integer;
  v_package_id uuid;
  v_group_id uuid;
  v_group_code text;
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
  v_guest_count := q.adults + coalesce(array_length(q.children_ages,1),0) + coalesce(array_length(q.infant_ages_months,1),0);
  if v_guest_count < 1 or v_guest_count > 8 then raise exception 'Private booking supports 1 to 8 guests' using errcode='22023'; end if;

  select id into v_package_id from public.packages where slug='family-friends-private-custom' limit 1;
  if v_package_id is null then
    insert into public.packages(slug,name,price,currency,positioning,active)
    values('family-friends-private-custom','Family & Friends — Custom Private Journey',0,q.quote_currency,'PRIVATE_CUSTOM',false)
    returning id into v_package_id;
  end if;

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
    E'\nCustom private journey. Do not automatically match with shared groups.'||
    case when nullif(trim(q.notes),'') is not null then E'\nCustomer notes: '||q.notes else '' end,
    'PUBLIC','PRIVATE_JOURNEY'
  ) returning id into v_booking_id;

  v_group_code := 'HE-PRIVATE-'||extract(year from now())::text||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.groups(group_id,package_id,departure_period_start,departure_period_end,capacity,status,notes)
  values(v_group_code,v_package_id,q.expected_travel_date,q.expected_travel_date+9,8,'PLANNING',
    'Private Family & Friends group for request '||q.reference||'. Not a public/shared group.')
  returning id into v_group_id;
  insert into public.group_members(group_id,booking_id,guest_count) values(v_group_id,v_booking_id,v_guest_count);
  insert into public.booking_travel_admin(booking_id,updated_by,internal_notes)
  values(v_booking_id,p_actor_id,'Private Family & Friends journey. Custom agreed price. Private group created in PLANNING. No payment recorded.');

  update public.family_friends_quote_requests set booking_id=v_booking_id,updated_at=now() where id=q.id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
  values(p_actor_id,'FAMILY_FRIENDS_REQUEST_CONVERTED','family_friends_quote_request',q.id,to_jsonb(q),
    jsonb_build_object('request_id',q.id,'reference',q.reference,'booking_id',v_booking_id,'booking_code',v_booking_code,
      'group_id',v_group_id,'group_code',v_group_code,'guest_count',v_guest_count,'amount',q.quote_amount,'currency',q.quote_currency));
  return query select v_booking_id,v_booking_code,false;
end;
$$;
revoke all on function public.convert_family_friends_quote_to_booking(uuid,uuid) from public,anon,authenticated;
grant execute on function public.convert_family_friends_quote_to_booking(uuid,uuid) to service_role;
