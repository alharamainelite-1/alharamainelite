create extension if not exists pgcrypto;

create type public.app_role as enum ('SUPER_ADMIN','ADMIN','OPERATIONS','SALES','FINANCE','HOST');
create type public.booking_status as enum ('NEW_REQUEST','CONTACTED','DETAILS_PENDING','PAYMENT_PENDING','PAYMENT_RECEIVED','CONFIRMED','PREPARING','ACTIVE','COMPLETED','CANCELLED');
create type public.payment_status as enum ('NOT_REQUESTED','PAYMENT_INSTRUCTIONS_SENT','PENDING_VERIFICATION','RECEIVED','PARTIALLY_RECEIVED','REFUNDED','FAILED');
create type public.host_status as enum ('AVAILABLE','ASSIGNED','OFF_DUTY','UNAVAILABLE');
create type public.task_status as enum ('PENDING','ASSIGNED','ACCEPTED','IN_PROGRESS','COMPLETED','CANCELLED');
create type public.review_status as enum ('DRAFT','PUBLISHED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'SALES',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug in ('signature','elite')),
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  currency char(3) not null default 'USD',
  positioning text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.package_features (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  feature text not null,
  sort_order int not null default 0,
  included boolean not null default true
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  whatsapp text not null,
  email text,
  country text not null,
  city text,
  preferred_language text not null default 'en' check (preferred_language in ('en','so','ar')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.journey_requests (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  customer_id uuid not null references public.customers(id),
  package_id uuid not null references public.packages(id),
  guest_count int not null check (guest_count between 1 and 8),
  expected_travel_date date,
  expected_period_start date,
  expected_period_end date,
  expected_period_label text,
  estimated_total numeric(12,2) not null check (estimated_total >= 0),
  currency char(3) not null default 'USD',
  additional_notes text,
  status public.booking_status not null default 'NEW_REQUEST',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expected_travel_date is not null or expected_period_label is not null or expected_period_start is not null)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_id text unique not null,
  request_id uuid unique references public.journey_requests(id),
  customer_id uuid not null references public.customers(id),
  package_id uuid not null references public.packages(id),
  guest_count int not null check (guest_count between 1 and 8),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  currency char(3) not null default 'USD',
  status public.booking_status not null default 'NEW_REQUEST',
  payment_status public.payment_status not null default 'NOT_REQUESTED',
  expected_travel_date date,
  expected_period_start date,
  expected_period_end date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.booking_guests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  full_name text,
  whatsapp text,
  email text,
  country text,
  city text,
  preferred_language text check (preferred_language in ('en','so','ar')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  group_id text unique not null,
  package_id uuid not null references public.packages(id),
  departure_period_start date,
  departure_period_end date,
  capacity int not null default 8 check (capacity between 1 and 8),
  status text not null default 'PLANNING',
  host_id uuid,
  hotel_makkah_id uuid,
  hotel_madinah_id uuid,
  hotel_jeddah_id uuid,
  transport_notes text,
  makkah_plan text,
  madinah_plan text,
  jeddah_plan text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  guest_count int not null default 1 check (guest_count between 1 and 8),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  unique(group_id, booking_id)
);

create table public.hosts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  whatsapp text,
  languages text[] not null default '{}',
  city text,
  availability text,
  status public.host_status not null default 'AVAILABLE',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.groups add constraint groups_host_fk foreign key (host_id) references public.hosts(id);

create table public.host_availability (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  available boolean not null default true,
  notes text,
  check (ends_at > starts_at)
);

create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null check (city in ('Makkah','Madinah','Jeddah')),
  address text,
  category text,
  room_types text[] not null default '{}',
  supplier text,
  contact_name text,
  phone text,
  email text,
  notes text,
  images text[] not null default '{}',
  availability_status text not null default 'AVAILABLE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.groups add constraint groups_hotel_makkah_fk foreign key (hotel_makkah_id) references public.hotels(id);
alter table public.groups add constraint groups_hotel_madinah_fk foreign key (hotel_madinah_id) references public.hotels(id);
alter table public.groups add constraint groups_hotel_jeddah_fk foreign key (hotel_jeddah_id) references public.hotels(id);

create table public.hotel_assignments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  hotel_id uuid not null references public.hotels(id),
  city text not null,
  room_type text,
  room_count int,
  check_in date,
  check_out date,
  notes text
);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  supplier text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text unique not null,
  type text not null check (type in ('Sedan','SUV','Van','Bus')),
  capacity int not null check (capacity > 0),
  driver_id uuid references public.drivers(id),
  supplier text,
  status text not null default 'AVAILABLE',
  notes text,
  created_at timestamptz not null default now()
);

create table public.train_bookings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  travel_date date,
  origin text,
  destination text,
  departure_time timestamptz,
  arrival_time timestamptz,
  reference text,
  status text not null default 'PENDING',
  notes text
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  city text,
  location text,
  description text,
  active boolean not null default true
);

create table public.booking_activities (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  activity_id uuid not null references public.activities(id),
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  check (booking_id is not null or group_id is not null)
);

create table public.host_tasks (
  id uuid primary key default gen_random_uuid(),
  task_id text unique not null,
  group_id uuid references public.groups(id),
  booking_id uuid references public.bookings(id),
  host_id uuid references public.hosts(id),
  date date not null,
  start_time time,
  end_time time,
  location text,
  task_type text not null check (task_type in ('AIRPORT_ASSISTANCE','TRAIN_ASSISTANCE','MAKKAH_ZIYARAT','MADINAH_ZIYARAT','JEDDAH_EXPERIENCE','SPECIAL_ASSISTANCE','OTHER')),
  notes text,
  status public.task_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  check (end_time is null or start_time is null or end_time > start_time)
);

create table public.operations_tasks (
  id uuid primary key default gen_random_uuid(),
  task_id text unique not null,
  group_id uuid references public.groups(id),
  date date not null,
  start_time time,
  end_time time,
  task_type text not null,
  assigned_host uuid references public.hosts(id),
  assigned_vehicle uuid references public.vehicles(id),
  location text,
  status public.task_status not null default 'PENDING',
  notes text
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_id text unique not null,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null default 'USD',
  date date,
  method text not null default 'BANK_TRANSFER',
  reference text,
  status public.payment_status not null default 'NOT_REQUESTED',
  notes text,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id),
  group_id uuid references public.groups(id),
  supplier text,
  category text not null check (category in ('HOTEL','TRANSPORT','HOST','TRAIN','ACTIVITY','MARKETING','OTHER')),
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null default 'USD',
  date date,
  reference text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.communication_templates (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  language text not null default 'en' check (language in ('en','so','ar')),
  subject text,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.communication_logs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id),
  customer_id uuid references public.customers(id),
  template_id uuid references public.communication_templates(id),
  channel text not null default 'WHATSAPP',
  status text not null default 'MANUAL_COPY',
  sent_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  country text,
  package_id uuid references public.packages(id),
  rating int check (rating between 1 and 5),
  review_text text not null,
  review_date date,
  verified boolean not null default false,
  status public.review_status not null default 'DRAFT',
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create index journey_requests_status_idx on public.journey_requests(status);
create index journey_requests_created_at_idx on public.journey_requests(created_at desc);
create index bookings_status_idx on public.bookings(status);
create index bookings_payment_status_idx on public.bookings(payment_status);
create index groups_period_idx on public.groups(departure_period_start, departure_period_end);
create index host_tasks_schedule_idx on public.host_tasks(date, start_time, end_time);
create index operations_tasks_schedule_idx on public.operations_tasks(date, start_time, end_time);
create index payments_booking_idx on public.payments(booking_id);
create index expenses_booking_idx on public.expenses(booking_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid());
$$;
create or replace function public.has_role(required_role public.app_role) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role = required_role or p.role = 'SUPER_ADMIN'));
$$;

alter table public.profiles enable row level security;
alter table public.packages enable row level security;
alter table public.package_features enable row level security;
alter table public.customers enable row level security;
alter table public.journey_requests enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_guests enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.hosts enable row level security;
alter table public.host_availability enable row level security;
alter table public.hotels enable row level security;
alter table public.hotel_assignments enable row level security;
alter table public.drivers enable row level security;
alter table public.vehicles enable row level security;
alter table public.train_bookings enable row level security;
alter table public.activities enable row level security;
alter table public.booking_activities enable row level security;
alter table public.host_tasks enable row level security;
alter table public.operations_tasks enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.communication_templates enable row level security;
alter table public.communication_logs enable row level security;
alter table public.reviews enable row level security;
alter table public.audit_logs enable row level security;
alter table public.site_settings enable row level security;

create policy packages_public_read on public.packages for select using (active = true);
create policy package_features_public_read on public.package_features for select using (exists (select 1 from public.packages p where p.id = package_id and p.active));
create policy reviews_public_read on public.reviews for select using (status = 'PUBLISHED' and verified = true);
create policy journey_requests_insert_public on public.journey_requests for insert with check (true);
create policy customers_insert_public on public.customers for insert with check (true);

create policy staff_profiles on public.profiles for all using (id = auth.uid() or public.is_staff());
create policy staff_customers on public.customers for select using (public.is_staff());
create policy staff_requests on public.journey_requests for all using (public.is_staff());
create policy staff_bookings on public.bookings for all using (public.is_staff());
create policy staff_booking_guests on public.booking_guests for all using (public.is_staff());
create policy staff_groups on public.groups for all using (public.is_staff());
create policy staff_group_members on public.group_members for all using (public.is_staff());
create policy staff_hosts on public.hosts for all using (public.is_staff());
create policy staff_host_availability on public.host_availability for all using (public.is_staff());
create policy staff_hotels on public.hotels for all using (public.is_staff());
create policy staff_hotel_assignments on public.hotel_assignments for all using (public.is_staff());
create policy staff_drivers on public.drivers for all using (public.is_staff());
create policy staff_vehicles on public.vehicles for all using (public.is_staff());
create policy staff_train on public.train_bookings for all using (public.is_staff());
create policy staff_activities on public.activities for all using (public.is_staff());
create policy staff_booking_activities on public.booking_activities for all using (public.is_staff());
create policy staff_host_tasks on public.host_tasks for all using (public.is_staff());
create policy staff_operations_tasks on public.operations_tasks for all using (public.is_staff());
create policy staff_payments on public.payments for all using (public.is_staff());
create policy staff_expenses on public.expenses for all using (public.is_staff());
create policy staff_templates on public.communication_templates for all using (public.is_staff());
create policy staff_logs on public.communication_logs for all using (public.is_staff());
create policy staff_reviews on public.reviews for all using (public.is_staff());
create policy staff_audit on public.audit_logs for all using (public.is_staff());
create policy staff_settings on public.site_settings for all using (public.is_staff());
