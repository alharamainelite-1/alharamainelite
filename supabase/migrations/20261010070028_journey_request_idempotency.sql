-- Prevent duplicate journey requests when the browser retries after a timeout or lost response.
-- Keep this table private; only the SECURITY DEFINER RPC owner can read/write it.
create table if not exists public.journey_request_idempotency (
  idempotency_key uuid primary key,
  request_fingerprint text not null,
  reference text not null,
  booking_id text not null,
  estimated_total numeric(12,2) not null,
  currency text not null,
  departure_date date not null,
  created_at timestamptz not null default now()
);

alter table public.journey_request_idempotency enable row level security;
revoke all on public.journey_request_idempotency from public, anon, authenticated, service_role;

-- Rename the implementation so the idempotent wrapper can call it without overload ambiguity.
alter function public.create_journey_request(
  text, text, text, text, text, text, text, integer,
  date, date, date, text, text, text, text, uuid
) rename to create_journey_request_without_idempotency;

revoke all on function public.create_journey_request_without_idempotency(
  text, text, text, text, text, text, text, integer,
  date, date, date, text, text, text, text, uuid
) from public, anon, authenticated;
grant execute on function public.create_journey_request_without_idempotency(
  text, text, text, text, text, text, text, integer,
  date, date, date, text, text, text, text, uuid
) to service_role;

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
  p_partner_slug text default null,
  p_departure_id uuid default null,
  p_idempotency_key uuid default null
)
returns table (
  reference text,
  booking_id text,
  estimated_total numeric,
  currency text,
  departure_date date,
  idempotency_replayed boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_fingerprint text;
  v_existing public.journey_request_idempotency%rowtype;
  v_result record;
begin
  -- Backward-compatible fallback while older deployed clients are still live.
  if p_idempotency_key is null then
    p_idempotency_key := gen_random_uuid();
  end if;

  v_fingerprint := md5(jsonb_build_object(
    'full_name', p_full_name,
    'whatsapp', p_whatsapp,
    'email', p_email,
    'country', p_country,
    'city', p_city,
    'preferred_language', p_preferred_language,
    'package_slug', p_package_slug,
    'guest_count', p_guest_count,
    'expected_travel_date', p_expected_travel_date,
    'expected_period_start', p_expected_period_start,
    'expected_period_end', p_expected_period_end,
    'expected_period_label', p_expected_period_label,
    'additional_notes', p_additional_notes,
    'lead_source', coalesce(nullif(trim(p_lead_source), ''), 'PUBLIC'),
    'partner_slug', nullif(lower(trim(coalesce(p_partner_slug, ''))), ''),
    'departure_id', p_departure_id
  )::text);

  -- Serialize concurrent submissions carrying the same key, including the first insert.
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  select * into v_existing
  from public.journey_request_idempotency
  where idempotency_key = p_idempotency_key;

  if found then
    if v_existing.request_fingerprint <> v_fingerprint then
      raise exception 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH'
        using errcode = '23505';
    end if;

    return query select
      v_existing.reference,
      v_existing.booking_id,
      v_existing.estimated_total,
      v_existing.currency::text,
      v_existing.departure_date,
      true;
    return;
  end if;

  select * into v_result
  from public.create_journey_request_without_idempotency(
    p_full_name,
    p_whatsapp,
    p_email,
    p_country,
    p_city,
    p_preferred_language,
    p_package_slug,
    p_guest_count,
    p_expected_travel_date,
    p_expected_period_start,
    p_expected_period_end,
    p_expected_period_label,
    p_additional_notes,
    p_lead_source,
    p_partner_slug,
    p_departure_id
  );

  insert into public.journey_request_idempotency (
    idempotency_key, request_fingerprint, reference, booking_id,
    estimated_total, currency, departure_date
  ) values (
    p_idempotency_key, v_fingerprint, v_result.reference, v_result.booking_id,
    v_result.estimated_total, v_result.currency, v_result.departure_date
  );

  return query select
    v_result.reference::text,
    v_result.booking_id::text,
    v_result.estimated_total::numeric,
    v_result.currency::text,
    v_result.departure_date::date,
    false;
end;
$$;

revoke all on function public.create_journey_request(
  text, text, text, text, text, text, text, integer,
  date, date, date, text, text, text, text, uuid, uuid
) from public, anon, authenticated;
grant execute on function public.create_journey_request(
  text, text, text, text, text, text, text, integer,
  date, date, date, text, text, text, text, uuid, uuid
) to service_role;
