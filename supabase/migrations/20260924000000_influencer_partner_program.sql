create extension if not exists pgcrypto;

create table if not exists public.influencer_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  whatsapp text not null,
  country text not null,
  slug text not null unique,
  status text not null default 'PENDING' check (status in ('PENDING','ACTIVE','SUSPENDED')),
  suspension_reason text,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers
  add column if not exists influencer_partner_id uuid references public.influencer_partners(id),
  add column if not exists influencer_attribution_expires_at timestamptz;
alter table public.journey_requests add column if not exists influencer_partner_id uuid references public.influencer_partners(id);
alter table public.bookings add column if not exists influencer_partner_id uuid references public.influencer_partners(id);

create table if not exists public.influencer_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.influencer_partners(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'REQUESTED' check (status in ('REQUESTED','REJECTED','PAID')),
  rejection_reason text,
  requested_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.influencer_commissions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.influencer_partners(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  type text not null check (type in ('COMMISSION','RECOVERY')),
  amount numeric(12,2) not null check (amount > 0),
  available_at timestamptz not null default now(),
  status text not null default 'PENDING' check (status in ('PENDING','PAID','REVERSED')),
  payout_id uuid references public.influencer_payouts(id) on delete set null,
  related_commission_id uuid references public.influencer_commissions(id) on delete set null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists idx_influencer_partners_slug on public.influencer_partners(slug);
create index if not exists idx_influencer_partners_status on public.influencer_partners(status);
create index if not exists idx_customers_influencer_partner on public.customers(influencer_partner_id);
create index if not exists idx_journey_requests_influencer_partner on public.journey_requests(influencer_partner_id);
create index if not exists idx_bookings_influencer_partner on public.bookings(influencer_partner_id);
create index if not exists idx_influencer_commissions_partner on public.influencer_commissions(partner_id,status,available_at);
create index if not exists idx_influencer_commissions_booking on public.influencer_commissions(booking_id);
create index if not exists idx_influencer_payouts_partner on public.influencer_payouts(partner_id,status);

alter table public.influencer_partners enable row level security;
alter table public.influencer_commissions enable row level security;
alter table public.influencer_payouts enable row level security;

drop policy if exists influencer_partner_self_select on public.influencer_partners;
create policy influencer_partner_self_select on public.influencer_partners for select to authenticated using (auth.uid()=user_id);
drop policy if exists influencer_commission_self_select on public.influencer_commissions;
create policy influencer_commission_self_select on public.influencer_commissions for select to authenticated using (partner_id in (select id from public.influencer_partners where user_id=auth.uid()));
drop policy if exists influencer_payout_self_select on public.influencer_payouts;
create policy influencer_payout_self_select on public.influencer_payouts for select to authenticated using (partner_id in (select id from public.influencer_partners where user_id=auth.uid()));

create or replace function public.partner_slug_exists(p_slug text)
returns boolean language sql security definer set search_path=public
as $$ select exists(select 1 from public.influencer_partners where slug=lower(trim(p_slug)) and status in ('PENDING','ACTIVE')); $$;
revoke all on function public.partner_slug_exists(text) from public;
grant execute on function public.partner_slug_exists(text) to anon,authenticated,service_role;

drop function if exists public.create_journey_request(text,text,text,text,text,text,text,integer,date,date,date,text,text,text);
create or replace function public.create_journey_request(
  p_full_name text,p_whatsapp text,p_email text,p_country text,p_city text,p_preferred_language text,
  p_package_slug text,p_guest_count integer,p_expected_travel_date date,p_expected_period_start date,
  p_expected_period_end date,p_expected_period_label text,p_additional_notes text,
  p_lead_source text default 'PUBLIC',p_partner_slug text default null)
returns table(reference text,booking_id text,estimated_total numeric,currency character)
language plpgsql security definer set search_path=public
as $function$
declare
 v_package public.packages%rowtype; v_customer_id uuid; v_request_id uuid; v_reference text; v_booking_id text;
 v_total numeric(12,2); v_source text:=coalesce(nullif(trim(p_lead_source),''),'PUBLIC'); v_partner_id uuid; v_existing_partner_id uuid; v_expiry timestamptz;
begin
 if v_source not in ('PUBLIC','WOMENS_UMRAH') then raise exception 'Invalid lead source'; end if;
 if p_full_name is null or char_length(trim(p_full_name)) not between 2 and 120 then raise exception 'Invalid full name'; end if;
 if p_whatsapp is null or char_length(trim(p_whatsapp)) not between 7 and 30 then raise exception 'Invalid WhatsApp number'; end if;
 if p_email is not null and char_length(trim(p_email))>160 then raise exception 'Invalid email'; end if;
 if p_country is null or char_length(trim(p_country)) not between 2 and 80 then raise exception 'Invalid country'; end if;
 if p_city is not null and char_length(trim(p_city))>80 then raise exception 'Invalid city'; end if;
 if p_additional_notes is not null and char_length(p_additional_notes)>2000 then raise exception 'Additional notes are too long'; end if;
 if p_expected_period_label is not null and char_length(trim(p_expected_period_label))>120 then raise exception 'Expected period is too long'; end if;
 if p_guest_count<5 or p_guest_count>8 then raise exception 'Guest count must be between 5 and 8'; end if;
 if p_preferred_language not in ('en','so','ar') then raise exception 'Invalid language'; end if;
 if p_expected_period_start is not null and p_expected_period_end is not null and p_expected_period_end<p_expected_period_start then raise exception 'Expected period end must be after start'; end if;
 if p_expected_travel_date is null and nullif(trim(coalesce(p_expected_period_label,'')),'') is null and p_expected_period_start is null then raise exception 'Expected travel date or period is required'; end if;
 select * into v_package from public.packages where slug=p_package_slug and active=true limit 1;
 if not found then raise exception 'Selected package is unavailable'; end if;
 v_total:=v_package.price*p_guest_count;
 select id,influencer_partner_id,influencer_attribution_expires_at into v_customer_id,v_existing_partner_id,v_expiry from public.customers where whatsapp=trim(p_whatsapp) order by created_at desc limit 1;
 if v_customer_id is null then
   if nullif(trim(coalesce(p_partner_slug,'')),'') is not null then
     select id into v_partner_id from public.influencer_partners where slug=lower(trim(p_partner_slug)) and status in ('PENDING','ACTIVE') limit 1;
   end if;
   insert into public.customers(full_name,whatsapp,email,country,city,preferred_language,influencer_partner_id)
   values(trim(p_full_name),trim(p_whatsapp),nullif(trim(p_email),''),trim(p_country),nullif(trim(p_city),''),p_preferred_language,v_partner_id)
   returning id into v_customer_id;
 else
   v_partner_id:=v_existing_partner_id;
   if v_partner_id is not null and v_expiry is not null and v_expiry<=now() then v_partner_id:=null;
   elsif v_partner_id is null and nullif(trim(coalesce(p_partner_slug,'')),'') is not null then
     select id into v_partner_id from public.influencer_partners where slug=lower(trim(p_partner_slug)) and status in ('PENDING','ACTIVE') limit 1;
   end if;
   update public.customers set full_name=trim(p_full_name),email=coalesce(nullif(trim(p_email),''),email),country=trim(p_country),city=nullif(trim(p_city),''),preferred_language=p_preferred_language,influencer_partner_id=coalesce(influencer_partner_id,v_partner_id),updated_at=now() where id=v_customer_id;
 end if;
 v_reference:='HE-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.request_number_seq')::text,5,'0');
 insert into public.journey_requests(reference,customer_id,package_id,guest_count,expected_travel_date,expected_period_start,expected_period_end,expected_period_label,estimated_total,currency,additional_notes,lead_source,influencer_partner_id)
 values(v_reference,v_customer_id,v_package.id,p_guest_count,p_expected_travel_date,p_expected_period_start,p_expected_period_end,nullif(trim(p_expected_period_label),''),v_total,v_package.currency,nullif(trim(p_additional_notes),''),v_source,(select influencer_partner_id from public.customers where id=v_customer_id)) returning id into v_request_id;
 v_booking_id:='HE-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.booking_number_seq')::text,5,'0');
 insert into public.bookings(booking_id,request_id,customer_id,package_id,guest_count,total_amount,currency,status,payment_status,expected_travel_date,expected_period_start,expected_period_end,notes,lead_source,influencer_partner_id)
 values(v_booking_id,v_request_id,v_customer_id,v_package.id,p_guest_count,v_total,v_package.currency,'NEW_REQUEST','NOT_REQUESTED',p_expected_travel_date,p_expected_period_start,p_expected_period_end,nullif(trim(p_additional_notes),''),v_source,(select influencer_partner_id from public.customers where id=v_customer_id));
 return query select v_reference,v_booking_id,v_total,v_package.currency;
end;
$function$;

revoke all on function public.create_journey_request(text,text,text,text,text,text,text,integer,date,date,date,text,text,text,text) from public;
grant execute on function public.create_journey_request(text,text,text,text,text,text,text,integer,date,date,date,text,text,text,text) to service_role;

create or replace function public.sync_partner_attribution_expiry()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
 if new.status='SUSPENDED' and old.status is distinct from 'SUSPENDED' then
   update public.customers set influencer_attribution_expires_at=now()+interval '30 days',updated_at=now() where influencer_partner_id=new.id and influencer_attribution_expires_at is null;
   new.suspended_at=coalesce(new.suspended_at,now());
 elsif new.status in ('PENDING','ACTIVE') and old.status='SUSPENDED' then
   update public.customers set influencer_attribution_expires_at=null,updated_at=now() where influencer_partner_id=new.id;
   new.suspended_at=null;
 end if;
 new.updated_at=now(); return new;
end; $$;
drop trigger if exists trg_partner_status_attribution on public.influencer_partners;
create trigger trg_partner_status_attribution before update of status on public.influencer_partners for each row execute function public.sync_partner_attribution_expiry();

create or replace function public.create_influencer_commission()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
 if new.payment_status='RECEIVED' and coalesce(old.payment_status,'NOT_REQUESTED')<>'RECEIVED' and new.influencer_partner_id is not null then
   if not exists(select 1 from public.influencer_commissions where booking_id=new.id and type='COMMISSION') then
     insert into public.influencer_commissions(partner_id,booking_id,type,amount,available_at)
     values(new.influencer_partner_id,new.id,'COMMISSION',round(new.total_amount*0.05,2),now()+interval '24 hours');
   end if;
 end if;
 return new;
end; $$;
drop trigger if exists trg_create_influencer_commission on public.bookings;
create trigger trg_create_influencer_commission after update of payment_status on public.bookings for each row execute function public.create_influencer_commission();

create or replace function public.handle_influencer_cancellation()
returns trigger language plpgsql security definer set search_path=public
as $$
declare c record;
begin
 if new.status='CANCELLED' and old.status is distinct from 'CANCELLED' and new.influencer_partner_id is not null then
   for c in select * from public.influencer_commissions where booking_id=new.id and type='COMMISSION' order by created_at asc loop
     if c.status='PENDING' and c.payout_id is null then
       update public.influencer_commissions set status='REVERSED' where id=c.id;
     elsif c.status='PAID' then
       if not exists(select 1 from public.influencer_commissions where related_commission_id=c.id and type='RECOVERY') then
         insert into public.influencer_commissions(partner_id,booking_id,type,amount,available_at,related_commission_id)
         values(c.partner_id,new.id,'RECOVERY',c.amount,now(),c.id);
       end if;
     end if;
   end loop;
 end if;
 return new;
end; $$;
drop trigger if exists trg_handle_influencer_cancellation on public.bookings;
create trigger trg_handle_influencer_cancellation after update of status on public.bookings for each row execute function public.handle_influencer_cancellation();
revoke all on function public.sync_partner_attribution_expiry() from public;
revoke all on function public.create_influencer_commission() from public;
revoke all on function public.handle_influencer_cancellation() from public;
grant select on public.influencer_partners,public.influencer_commissions,public.influencer_payouts to authenticated;