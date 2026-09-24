
create table if not exists public.api_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from anon, authenticated;
grant all on table public.api_rate_limits to service_role;

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_hash text;
  v_now timestamptz := clock_timestamp();
  v_window_started timestamptz;
  v_count integer;
begin
  if p_key is null or length(trim(p_key)) < 8 then
    raise exception 'invalid rate-limit key';
  end if;
  if p_limit < 1 or p_limit > 10000 or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate-limit configuration';
  end if;

  v_hash := encode(extensions.digest(convert_to(p_key, 'utf8'), 'sha256'), 'hex');

  insert into public.api_rate_limits(key_hash, window_started_at, request_count, updated_at)
  values (v_hash, v_now, 1, v_now)
  on conflict (key_hash) do update
    set request_count = case
      when public.api_rate_limits.window_started_at <= (v_now - make_interval(secs => p_window_seconds))
        then 1
      else public.api_rate_limits.request_count + 1
    end,
    window_started_at = case
      when public.api_rate_limits.window_started_at <= (v_now - make_interval(secs => p_window_seconds))
        then v_now
      else public.api_rate_limits.window_started_at
    end,
    updated_at = v_now
  returning public.api_rate_limits.window_started_at, public.api_rate_limits.request_count
  into v_window_started, v_count;

  return query
  select
    v_count <= p_limit,
    case
      when v_count <= p_limit then 0
      else greatest(1, ceil(extract(epoch from ((v_window_started + make_interval(secs => p_window_seconds)) - v_now)))::integer)
    end;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

create or replace function public.request_partner_payout(
  p_partner_id uuid,
  p_actor_id uuid
)
returns table(id uuid, amount numeric, status text, requested_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_partner public.influencer_partners%rowtype;
  v_payout public.influencer_payouts%rowtype;
  v_balance numeric := 0;
  v_commission_ids uuid[];
begin
  select * into v_partner from public.influencer_partners where id = p_partner_id for update;
  if not found then raise exception 'partner_not_found'; end if;
  if p_actor_id is null or v_partner.user_id <> p_actor_id then raise exception 'partner_actor_mismatch'; end if;
  if v_partner.status not in ('PENDING', 'ACTIVE') then raise exception 'partner_not_eligible'; end if;

  select coalesce(sum(case when c.type = 'RECOVERY' then -c.amount else c.amount end), 0),
         coalesce(array_agg(c.id order by c.available_at, c.created_at), '{}'::uuid[])
  into v_balance, v_commission_ids
  from (
    select c.id,c.amount,c.type,c.available_at,c.created_at
    from public.influencer_commissions c
    where c.partner_id = p_partner_id
      and c.payout_id is null
      and c.status = 'PENDING'
      and c.available_at <= clock_timestamp()
    order by c.available_at, c.created_at
    for update
  ) c;

  if v_balance < 500 then raise exception 'minimum_payout_balance'; end if;

  insert into public.influencer_payouts(partner_id, amount, status)
  values (p_partner_id, v_balance, 'REQUESTED')
  returning * into v_payout;

  update public.influencer_commissions
  set payout_id = v_payout.id
  where id = any(v_commission_ids)
    and payout_id is null
    and status = 'PENDING'
    and available_at <= clock_timestamp();
  if not found then raise exception 'payout_reservation_failed'; end if;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values (
    p_actor_id, 'PARTNER_PAYOUT_REQUESTED', 'influencer_payout', v_payout.id, null,
    jsonb_build_object('partner_id',p_partner_id,'amount',v_payout.amount,'status',v_payout.status,'requested_at',v_payout.requested_at,'commission_ids',v_commission_ids)
  );

  return query select v_payout.id, v_payout.amount, v_payout.status, v_payout.requested_at;
end;
$$;

revoke all on function public.request_partner_payout(uuid, uuid) from public, anon, authenticated;
grant execute on function public.request_partner_payout(uuid, uuid) to service_role;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, public;

alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences from anon, authenticated;

do $$
declare r record;
begin
  for r in
    select format('%I.%I', schemaname, tablename) as rel
    from pg_tables where schemaname = 'public'
  loop
    execute format('revoke insert, update, delete, truncate, references, trigger on table %s from anon, authenticated', r.rel);
  end loop;
end;
$$;
