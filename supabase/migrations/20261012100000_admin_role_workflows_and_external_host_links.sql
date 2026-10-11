-- Additive operational workflows for approved staff roles and external host responses.
create extension if not exists pgcrypto;
create table if not exists public.operations_booking_requests (
 id uuid primary key default gen_random_uuid(), request_code text unique not null,
 booking_id uuid references public.bookings(id) on delete set null, group_id uuid references public.groups(id) on delete set null,
 journey_label text, service_type text not null check (service_type in ('HOTEL','TRANSPORT','TRAIN','ZIYARAT','ACTIVITY','OTHER')),
 status text not null default 'REQUESTED' check (status in ('DRAFT','REQUESTED','QUOTED','NEEDS_INFO','CONFIRMED','CANCELLED')),
 supplier_name text, supplier_contact text, requested_by uuid references public.profiles(id) on delete set null,
 assigned_to uuid references public.profiles(id) on delete set null, requested_for date, details jsonb not null default '{}'::jsonb,
 quote_amount numeric(12,2), quote_currency text not null default 'SAR' check (quote_currency in ('SAR','USD')),
 final_amount numeric(12,2), confirmation_reference text, missing_information text, internal_notes text,
 approved_by uuid references public.profiles(id) on delete set null, approved_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint ops_booking_quote_nonnegative check (quote_amount is null or quote_amount >= 0),
 constraint ops_booking_final_nonnegative check (final_amount is null or final_amount >= 0)
);
create index if not exists operations_booking_requests_status_date_idx on public.operations_booking_requests(status, requested_for);
create index if not exists operations_booking_requests_booking_idx on public.operations_booking_requests(booking_id);
alter table public.operations_booking_requests enable row level security;
create table if not exists public.guest_support_cases (
 id uuid primary key default gen_random_uuid(), case_code text unique not null, booking_id uuid references public.bookings(id) on delete set null,
 customer_id uuid references public.customers(id) on delete set null,
 category text not null check (category in ('QUESTION','COMPLAINT','CHANGE_REQUEST','ACCESSIBILITY','PAYMENT_QUERY','SERVICE_ISSUE','OTHER')),
 priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH','URGENT')),
 status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','WAITING_CUSTOMER','WAITING_INTERNAL','RESOLVED','CLOSED')),
 subject text not null, description text not null, assigned_staff_id uuid references public.profiles(id) on delete set null,
 created_by uuid references public.profiles(id) on delete set null, follow_up_at timestamptz, escalated_at timestamptz,
 resolution text, resolved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists guest_support_cases_status_followup_idx on public.guest_support_cases(status, follow_up_at);
create index if not exists guest_support_cases_booking_idx on public.guest_support_cases(booking_id);
create index if not exists guest_support_cases_assignee_idx on public.guest_support_cases(assigned_staff_id);
alter table public.guest_support_cases enable row level security;
create table if not exists public.host_task_action_tokens (
 id uuid primary key default gen_random_uuid(), host_task_id uuid not null references public.host_tasks(id) on delete cascade,
 token_hash text unique not null, action_type text not null default 'RESPONSE' check (action_type = 'RESPONSE'),
 expires_at timestamptz not null, used_at timestamptz, response text check (response in ('ACCEPTED','DECLINED')),
 response_note text, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create index if not exists host_task_action_tokens_task_idx on public.host_task_action_tokens(host_task_id);
alter table public.host_task_action_tokens enable row level security;
drop policy if exists "operations booking requests manager read" on public.operations_booking_requests;
create policy "operations booking requests manager read" on public.operations_booking_requests for select to authenticated using (
 exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('SUPER_ADMIN','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','JOURNEY_COORDINATOR','OPERATIONS','BOOKINGS','FINANCE'))
);
drop policy if exists "guest support cases authorized read" on public.guest_support_cases;
create policy "guest support cases authorized read" on public.guest_support_cases for select to authenticated using (
 exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('SUPER_ADMIN','CUSTOMER_SERVICE','SALES','BOOKINGS','OPERATIONS_MANAGER','OPERATIONS_SUPERVISOR','JOURNEY_COORDINATOR'))
);
drop policy if exists "host task tokens no direct access" on public.host_task_action_tokens;
create policy "host task tokens no direct access" on public.host_task_action_tokens for all to anon, authenticated using (false) with check (false);
