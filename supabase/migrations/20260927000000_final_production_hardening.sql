-- Final production hardening and production-schema reconciliation.

alter table public.hosts add column if not exists user_id uuid;
do $$
begin
  if not exists (select 1 from pg_constraint where conname='hosts_user_id_fkey' and conrelid='public.hosts'::regclass) then
    alter table public.hosts add constraint hosts_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
  end if;
end $$;

alter table public.operations_tasks add column if not exists assigned_staff_id uuid;
do $$
begin
  if not exists (select 1 from pg_constraint where conname='operations_tasks_assigned_staff_id_fkey' and conrelid='public.operations_tasks'::regclass) then
    alter table public.operations_tasks add constraint operations_tasks_assigned_staff_id_fkey foreign key (assigned_staff_id) references public.profiles(id) on delete set null;
  end if;
end $$;

create table if not exists public.staff_activity (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('LOGIN','LOGOUT')),
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
alter table public.staff_activity enable row level security;
grant select on table public.staff_activity to authenticated;
grant all on table public.staff_activity to service_role;
do $$
begin
  if not exists (select 1 from pg_policy where polname='staff_activity_self_select' and polrelid='public.staff_activity'::regclass) then
    create policy staff_activity_self_select on public.staff_activity for select to authenticated using ((select auth.uid()) = staff_id);
  end if;
end $$;

create table if not exists public.operations_task_slas (
  id uuid primary key default gen_random_uuid(),
  task_type text not null unique,
  target_minutes integer not null check (target_minutes > 0),
  warning_minutes integer not null default 60 check (warning_minutes >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.operations_task_slas enable row level security;
grant select on table public.operations_task_slas to authenticated;
grant all on table public.operations_task_slas to service_role;
do $$
begin
  if exists (select 1 from pg_policy where polname='staff can read task slas' and polrelid='public.operations_task_slas'::regclass) then
    alter policy "staff can read task slas" on public.operations_task_slas using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS')));
  else
    create policy "staff can read task slas" on public.operations_task_slas for select to authenticated using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS')));
  end if;
end $$;

insert into public.operations_task_slas (task_type,target_minutes,warning_minutes,active)
values ('AIRPORT_ASSISTANCE',90,45,true),('AIRPORT_TRANSFER',120,60,true),('HOTEL_TRANSFER',90,45,true),
('JEDDAH_EXPERIENCE',360,60,true),('MADINAH_ZIYARAT',240,60,true),('MAKKAH_ZIYARAT',240,60,true),
('OTHER',120,60,true),('SPECIAL_ASSISTANCE',60,30,true),('TRAIN_ASSISTANCE',60,30,true)
on conflict (task_type) do update set target_minutes=excluded.target_minutes,warning_minutes=excluded.warning_minutes,active=excluded.active,updated_at=now();

create index if not exists custody_items_issued_by_idx on public.custody_items (issued_by);
create index if not exists custody_items_returned_to_idx on public.custody_items (returned_to);
create index if not exists expenses_approved_by_idx on public.expenses (approved_by);
create index if not exists expenses_created_by_idx on public.expenses (created_by);
create index if not exists finance_cost_catalog_supplier_id_idx on public.finance_cost_catalog (supplier_id);
create index if not exists journey_costs_catalog_item_id_idx on public.journey_costs (catalog_item_id);
create index if not exists journey_costs_created_by_idx on public.journey_costs (created_by);
create index if not exists journey_costs_supplier_id_idx on public.journey_costs (supplier_id);
create index if not exists staff_bonuses_approved_by_idx on public.staff_bonuses (approved_by);
create index if not exists staff_compensation_updated_by_idx on public.staff_compensation (updated_by);
create index if not exists staff_payments_paid_by_idx on public.staff_payments (paid_by);

do $$
begin
  if not exists (select 1 from pg_constraint where conname='bookings_guest_count_contract_check' and conrelid='public.bookings'::regclass) then
    alter table public.bookings add constraint bookings_guest_count_contract_check check (guest_count between 5 and 8) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='journey_requests_guest_count_contract_check' and conrelid='public.journey_requests'::regclass) then
    alter table public.journey_requests add constraint journey_requests_guest_count_contract_check check (guest_count between 5 and 8) not valid;
  end if;
end $$;

create or replace function public.create_journey_request(
  p_full_name text,p_whatsapp text,p_email text,p_country text,p_city text,p_preferred_language text,p_package_slug text,
  p_guest_count integer,p_expected_travel_date date,p_expected_period_start date,p_expected_period_end date,p_expected_period_label text,
  p_additional_notes text,p_lead_source text default 'PUBLIC',p_partner_slug text default null
)
returns table(reference text,booking_id text,estimated_total numeric,currency character)
language plpgsql security definer set search_path=public
as $function$
declare
  v_package public.packages%rowtype; v_customer_id uuid; v_request_id uuid; v_reference text; v_booking_id text; v_total numeric(12,2);
  v_source text:=coalesce(nullif(trim(p_lead_source),''),'PUBLIC'); v_partner_id uuid; v_existing_partner_id uuid;
  v_expiry timestamptz; v_partner_status text; v_partner_slug text:=nullif(lower(trim(coalesce(p_partner_slug,''))),'');
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
  select id,influencer_partner_id,influencer_attribution_expires_at into v_customer_id,v_existing_partner_id,v_expiry
  from public.customers where whatsapp=trim(p_whatsapp) order by created_at desc limit 1;
  if v_customer_id is null then
    if v_partner_slug is not null then
      select id into v_partner_id from public.influencer_partners where slug=v_partner_slug and status in ('PENDING','ACTIVE') limit 1;
    end if;
    insert into public.customers(full_name,whatsapp,email,country,city,preferred_language,influencer_partner_id,influencer_attribution_expires_at)
    values(trim(p_full_name),trim(p_whatsapp),nullif(trim(p_email),''),trim(p_country),nullif(trim(p_city),''),p_preferred_language,v_partner_id,
      case when v_partner_id is not null then now()+interval '30 days' else null end)
    returning id into v_customer_id;
  else
    v_partner_id:=v_existing_partner_id;
    if v_partner_id is not null then
      select status into v_partner_status from public.influencer_partners where id=v_partner_id;
      if v_expiry is not null and v_expiry<=now() then v_partner_id:=null;
      elsif v_partner_status not in ('PENDING','ACTIVE') then v_partner_id:=null;
      elsif v_expiry is null then v_expiry:=now()+interval '30 days';
      end if;
    end if;
    if v_partner_id is null and v_partner_slug is not null then
      select id into v_partner_id from public.influencer_partners where slug=v_partner_slug and status in ('PENDING','ACTIVE') limit 1;
      if v_partner_id is not null then v_expiry:=now()+interval '30 days'; else v_expiry:=null; end if;
    elsif v_partner_id is null then v_expiry:=null;
    end if;
    update public.customers set full_name=trim(p_full_name),email=coalesce(nullif(trim(p_email),''),email),country=trim(p_country),city=nullif(trim(p_city),''),
      preferred_language=p_preferred_language,influencer_partner_id=v_partner_id,influencer_attribution_expires_at=v_expiry,updated_at=now() where id=v_customer_id;
  end if;
  v_reference:='HE-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.request_number_seq')::text,5,'0');
  insert into public.journey_requests(reference,customer_id,package_id,guest_count,expected_travel_date,expected_period_start,expected_period_end,expected_period_label,estimated_total,currency,additional_notes,lead_source,influencer_partner_id)
  values(v_reference,v_customer_id,v_package.id,p_guest_count,p_expected_travel_date,p_expected_period_start,p_expected_period_end,nullif(trim(p_expected_period_label),''),v_total,v_package.currency,nullif(trim(p_additional_notes),''),v_source,(select influencer_partner_id from public.customers where id=v_customer_id))
  returning id into v_request_id;
  v_booking_id:='HE-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.booking_number_seq')::text,5,'0');
  insert into public.bookings(booking_id,request_id,customer_id,package_id,guest_count,total_amount,currency,status,payment_status,expected_travel_date,expected_period_start,expected_period_end,notes,lead_source,influencer_partner_id)
  values(v_booking_id,v_request_id,v_customer_id,v_package.id,p_guest_count,v_total,v_package.currency,'NEW_REQUEST','NOT_REQUESTED',p_expected_travel_date,p_expected_period_start,p_expected_period_end,nullif(trim(p_additional_notes),''),v_source,(select influencer_partner_id from public.customers where id=v_customer_id));
  return query select v_reference,v_booking_id,v_total,v_package.currency;
end;
$function$;

create or replace function public.create_influencer_commission()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if new.payment_status='RECEIVED' and coalesce(old.payment_status,'NOT_REQUESTED')<>'RECEIVED' and new.influencer_partner_id is not null
     and not exists (select 1 from public.influencer_commissions c where c.booking_id=new.id and c.type='COMMISSION' and c.status in ('PENDING','PAID')
       and not exists (select 1 from public.influencer_commissions r where r.type='RECOVERY' and r.related_commission_id=c.id))
  then
    insert into public.influencer_commissions(partner_id,booking_id,type,amount,available_at)
    values(new.influencer_partner_id,new.id,'COMMISSION',round(new.total_amount*0.05,2),now()+interval '24 hours');
  end if;
  return new;
end;
$$;

create or replace trigger trg_create_influencer_commission
after update of payment_status on public.bookings for each row execute function public.create_influencer_commission();

create or replace function public.handle_influencer_payment_reversal()
returns trigger language plpgsql security definer set search_path=public
as $$
declare c record;
begin
  if old.payment_status='RECEIVED' and new.payment_status in ('PARTIALLY_RECEIVED','REFUNDED','FAILED','NOT_REQUESTED','PAYMENT_INSTRUCTIONS_SENT','PENDING_VERIFICATION')
     and new.influencer_partner_id is not null
  then
    for c in select * from public.influencer_commissions where booking_id=new.id and type='COMMISSION' order by created_at asc loop
      if c.status='PENDING' then
        if c.payout_id is not null then
          update public.influencer_payouts set status='REJECTED',rejection_reason='Payment reversed before commission payout.',paid_at=null where id=c.payout_id and status='REQUESTED';
          update public.influencer_commissions set payout_id=null where payout_id=c.payout_id;
        end if;
        update public.influencer_commissions set status='REVERSED' where id=c.id;
      elsif c.status='PAID' then
        if not exists (select 1 from public.influencer_commissions where related_commission_id=c.id and type='RECOVERY') then
          insert into public.influencer_commissions(partner_id,booking_id,type,amount,available_at,related_commission_id)
          values(c.partner_id,new.id,'RECOVERY',c.amount,now(),c.id);
        end if;
      end if;
    end loop;
  end if;
  return new;
end;
$$;

create or replace trigger trg_handle_influencer_payment_reversal
after update of payment_status on public.bookings for each row execute function public.handle_influencer_payment_reversal();

revoke execute on function public.handle_influencer_payment_reversal() from anon, authenticated, public;
