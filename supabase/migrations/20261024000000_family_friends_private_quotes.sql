create sequence if not exists public.family_friends_quote_number_seq start 1 increment 1;

create table if not exists public.family_friends_quote_requests (
 id uuid primary key default gen_random_uuid(),
 reference text not null unique default ('HE-FF-' || to_char(now() at time zone 'UTC','YYYY') || '-' || lpad(nextval('public.family_friends_quote_number_seq')::text,5,'0')),
 full_name text not null check (char_length(trim(full_name)) between 2 and 120),
 phone text not null check (char_length(trim(phone)) between 7 and 30),
 email text,
 country text not null,
 preferred_language text not null default 'en' check (preferred_language in ('en','so','ar')),
 adults integer not null check (adults between 1 and 40),
 children_ages integer[] not null default '{}',
 infant_ages_months integer[] not null default '{}',
 expected_travel_date date not null,
 duration_days integer not null default 10 check (duration_days = 10),
 duration_nights integer not null default 9 check (duration_nights = 9),
 notes text,
 status text not null default 'NEW' check (status in ('NEW','PRICING','QUOTE_SENT','AWAITING_CUSTOMER','CONFIRMED','CANCELLED')),
 quote_amount numeric(12,2) check (quote_amount is null or quote_amount >= 0),
 quote_currency text not null default 'USD' check (quote_currency in ('USD','SAR')),
 quote_sent_at timestamptz,
 assigned_to uuid references public.profiles(id) on delete set null,
 whatsapp_last_contact_at timestamptz,
 internal_notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists family_friends_quote_status_created_idx on public.family_friends_quote_requests(status, created_at desc);
create index if not exists family_friends_quote_assigned_idx on public.family_friends_quote_requests(assigned_to, status);
alter table public.family_friends_quote_requests enable row level security;
revoke all on public.family_friends_quote_requests from anon, authenticated;
grant all on public.family_friends_quote_requests to service_role;
comment on table public.family_friends_quote_requests is 'Private FAMILY & FRIENDS quote requests. Requests are created and managed through server routes with rate limiting and staff authorization; not automatically converted into bookings.'
