-- Guest review invitation foundation: one private invitation per completed booking.
alter table public.reviews
  add column if not exists booking_id uuid references public.bookings(id) on delete set null,
  add column if not exists service_ratings jsonb not null default '{}'::jsonb,
  add column if not exists image_path text,
  add column if not exists image_consent boolean not null default false;

create unique index if not exists reviews_booking_id_unique
  on public.reviews(booking_id) where booking_id is not null;

create table if not exists public.review_invitations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  token_hash text not null unique check (length(token_hash)=64),
  language text not null default 'en' check (language in ('en','so','ar')),
  created_by uuid references public.profiles(id),
  sent_at timestamptz,
  expires_at timestamptz not null default (now() + interval '90 days'),
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.review_invitations enable row level security;
revoke all on public.review_invitations from anon, authenticated;
grant all on public.review_invitations to service_role;

create or replace function public.submit_guest_review(
  p_token text,
  p_review_text text,
  p_service_ratings jsonb,
  p_display_name text default null,
  p_image_path text default null,
  p_image_consent boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inv public.review_invitations%rowtype;
  v_booking public.bookings%rowtype;
  v_customer public.customers%rowtype;
  v_review_id uuid;
  v_rating integer;
  v_count integer;
  v_bad boolean;
begin
  if p_token is null or length(p_token) < 24 or length(p_token) > 256 then
    return jsonb_build_object('ok',false,'error','invalid_link');
  end if;
  if p_review_text is null or length(btrim(p_review_text)) < 10 or length(p_review_text) > 3000 then
    return jsonb_build_object('ok',false,'error','invalid_review');
  end if;
  if jsonb_typeof(p_service_ratings) <> 'object' then
    return jsonb_build_object('ok',false,'error','invalid_ratings');
  end if;
  select count(*), coalesce(bool_or(
    key not in ('accommodation','transportation','host','umrah_organization','customer_support','overall')
    or jsonb_typeof(value) <> 'number'
    or (value #>> '{}') !~ '^[1-5]$'
  ),false)
  into v_count,v_bad from jsonb_each(p_service_ratings);
  if v_count <> 6 or v_bad then
    return jsonb_build_object('ok',false,'error','invalid_ratings');
  end if;
  select * into v_inv from public.review_invitations
   where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')
     and submitted_at is null and expires_at > now()
   for update;
  if not found then return jsonb_build_object('ok',false,'error','invalid_or_used_link'); end if;
  select * into v_booking from public.bookings where id=v_inv.booking_id and status='COMPLETED';
  if not found then return jsonb_build_object('ok',false,'error','booking_not_completed'); end if;
  select * into v_customer from public.customers where id=v_booking.customer_id;
  v_rating := round((select avg((value #>> '{}')::numeric) from jsonb_each(p_service_ratings)))::integer;
  insert into public.reviews(booking_id,guest_name,country,city,package_id,rating,review_text,
    review_date,verified,status,service_ratings,image_path,image_consent)
  values(v_booking.id,
    coalesce(nullif(btrim(p_display_name),''),v_customer.full_name,'Guest'),
    v_customer.country,v_customer.city,v_booking.package_id,v_rating,btrim(p_review_text),
    current_date,true,'DRAFT',p_service_ratings,
    case when p_image_consent then nullif(p_image_path,'') else null end,p_image_consent)
  returning id into v_review_id;
  update public.review_invitations set submitted_at=now() where id=v_inv.id;
  return jsonb_build_object('ok',true,'review_id',v_review_id);
end;
$$;
revoke all on function public.submit_guest_review(text,text,jsonb,text,text,boolean) from public;
grant execute on function public.submit_guest_review(text,text,jsonb,text,text,boolean) to anon, authenticated;
