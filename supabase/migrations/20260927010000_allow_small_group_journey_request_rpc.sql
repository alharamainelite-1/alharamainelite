-- Keep the journey-request RPC aligned with the public 1–8 guest booking contract.
-- Small parties (1–4) are accepted and later handled by group matching.

create or replace function public.create_journey_request(
  p_full_name text,
  p_whatsapp text,
  p_email text,
  p_country text,
  p_city text,
  p_preferred_language text,
  p_package_slug text,
  p_guest_count integer,
  p_expected_travel_date date,
  p_expected_period_start date,
  p_expected_period_end date,
  p_expected_period_label text,
  p_additional_notes text,
  p_lead_source text default 'PUBLIC',
  p_partner_slug text default null
)
returns table(reference text, booking_id text, estimated_total numeric, currency character)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_package public.packages%rowtype;
  v_customer_id uuid;
  v_request_id uuid;
  v_reference text;
  v_booking_id text;
  v_total numeric(12,2);
  v_source text := coalesce(nullif(trim(p_lead_source),''),'PUBLIC');
  v_partner_id uuid;
  v_existing_partner_id uuid;
  v_expiry timestamptz;
  v_partner_status text;
  v_partner_slug text := nullif(lower(trim(coalesce(p_partner_slug,''))),'');
begin
  if v_source not in ('PUBLIC','WOMENS_UMRAH') then raise exception 'Invalid lead source'; end if;
  if p_full_name is null or char_length(trim(p_full_name)) not between 2 and 120 then raise exception 'Invalid full name'; end if;
  if p_whatsapp is null or char_length(trim(p_whatsapp)) not between 7 and 30 then raise exception 'Invalid WhatsApp number'; end if;
  if p_email is not null and char_length(trim(p_email))>160 then raise exception 'Invalid email'; end if;
  if p_country is null or char_length(trim(p_country)) not between 2 and 80 then raise exception 'Invalid country'; end if;
  if p_city is not null and char_length(trim(p_city))>80 then raise exception 'Invalid city'; end if;
  if p_additional_notes is not null and char_length(p_additional_notes)>2000 then raise exception 'Additional notes are too long'; end if;
  if p_expected_period_label is not null and char_length(trim(p_expected_period_label))>120 then raise exception 'Expected period is too long'; end if;
  if p_guest_count<1 or p_guest_count>8 then raise exception 'Guest count must be between 1 and 8'; end if;
  if p_preferred_language not in ('en','so','ar') then raise exception 'Invalid language'; end if;
  if p_expected_period_start is not null and p_expected_period_end is not null and p_expected_period_end<p_expected_period_start then raise exception 'Expected period end must be after start'; end if;
  if p_expected_travel_date is null and nullif(trim(coalesce(p_expected_period_label,'')),'') is null and p_expected_period_start is null then raise exception 'Expected travel date or period is required'; end if;

  select * into v_package
  from public.packages
  where slug=p_package_slug and active=true
  limit 1;
  if not found then raise exception 'Selected package is unavailable'; end if;

  v_total:=v_package.price*p_guest_count;

  select id,influencer_partner_id,influencer_attribution_expires_at
    into v_customer_id,v_existing_partner_id,v_expiry
  from public.customers
  where whatsapp=trim(p_whatsapp)
  order by created_at desc
  limit 1;

  if v_customer_id is null then
    if v_partner_slug is not null then
      select id into v_partner_id
      from public.influencer_partners
      where slug=v_partner_slug and status in ('PENDING','ACTIVE')
      limit 1;
    end if;

    insert into public.customers(
      full_name,whatsapp,email,country,city,preferred_language,
      influencer_partner_id,influencer_attribution_expires_at
    )
    values(
      trim(p_full_name),trim(p_whatsapp),nullif(trim(p_email),''),trim(p_country),
      nullif(trim(p_city),''),p_preferred_language,v_partner_id,
      case when v_partner_id is not null then now()+interval '30 days' else null end
    )
    returning id into v_customer_id;
  else
    v_partner_id:=v_existing_partner_id;

    if v_partner_id is not null then
      select status into v_partner_status
      from public.influencer_partners
      where id=v_partner_id;

      if v_expiry is not null and v_expiry<=now() then
        v_partner_id:=null;
      elsif v_partner_status not in ('PENDING','ACTIVE') then
        v_partner_id:=null;
      elsif v_expiry is null then
        v_expiry:=now()+interval '30 days';
      end if;
    end if;

    if v_partner_id is null and v_partner_slug is not null then
      select id into v_partner_id
      from public.influencer_partners
      where slug=v_partner_slug and status in ('PENDING','ACTIVE')
      limit 1;
      if v_partner_id is not null then
        v_expiry:=now()+interval '30 days';
      else
        v_expiry:=null;
      end if;
    elsif v_partner_id is null then
      v_expiry:=null;
    end if;

    update public.customers
    set full_name=trim(p_full_name),
        email=coalesce(nullif(trim(p_email),''),email),
        country=trim(p_country),
        city=nullif(trim(p_city),''),
        preferred_language=p_preferred_language,
        influencer_partner_id=v_partner_id,
        influencer_attribution_expires_at=v_expiry,
        updated_at=now()
    where id=v_customer_id;
  end if;

  v_reference:='HE-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.request_number_seq')::text,5,'0');

  insert into public.journey_requests(
    reference,customer_id,package_id,guest_count,expected_travel_date,
    expected_period_start,expected_period_end,expected_period_label,
    estimated_total,currency,additional_notes,lead_source,influencer_partner_id
  )
  values(
    v_reference,v_customer_id,v_package.id,p_guest_count,p_expected_travel_date,
    p_expected_period_start,p_expected_period_end,
    nullif(trim(p_expected_period_label),''),
    v_total,v_package.currency,nullif(trim(p_additional_notes),''),
    v_source,(select influencer_partner_id from public.customers where id=v_customer_id)
  )
  returning id into v_request_id;

  v_booking_id:='HE-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.booking_number_seq')::text,5,'0');

  insert into public.bookings(
    booking_id,request_id,customer_id,package_id,guest_count,total_amount,currency,
    status,payment_status,expected_travel_date,expected_period_start,
    expected_period_end,notes,lead_source,influencer_partner_id
  )
  values(
    v_booking_id,v_request_id,v_customer_id,v_package.id,p_guest_count,v_total,
    v_package.currency,'NEW_REQUEST','NOT_REQUESTED',p_expected_travel_date,
    p_expected_period_start,p_expected_period_end,
    nullif(trim(p_additional_notes),''),v_source,
    (select influencer_partner_id from public.customers where id=v_customer_id)
  );

  return query select v_reference,v_booking_id,v_total,v_package.currency;
end;
$function$;
