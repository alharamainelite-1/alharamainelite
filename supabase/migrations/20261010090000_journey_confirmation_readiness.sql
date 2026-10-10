-- Journey confirmation operational readiness and issuance audit.
alter table public.hotel_assignments
  add column if not exists confirmation_status text not null default 'PENDING',
  add column if not exists confirmation_reference text,
  add column if not exists confirmed_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'hotel_assignments_confirmation_status_check') then
    alter table public.hotel_assignments add constraint hotel_assignments_confirmation_status_check
      check (confirmation_status in ('PENDING','CONFIRMED','CANCELLED')) not valid;
  end if;
end $$;
alter table public.hotel_assignments validate constraint hotel_assignments_confirmation_status_check;

alter table public.booking_activities
  add column if not exists confirmation_status text not null default 'PENDING',
  add column if not exists confirmation_reference text,
  add column if not exists confirmed_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'booking_activities_confirmation_status_check') then
    alter table public.booking_activities add constraint booking_activities_confirmation_status_check
      check (confirmation_status in ('PENDING','CONFIRMED','CANCELLED')) not valid;
  end if;
end $$;
alter table public.booking_activities validate constraint booking_activities_confirmation_status_check;

create table if not exists public.journey_confirmation_documents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  version integer not null,
  language text not null check (language in ('ar','en')),
  document_status text not null default 'GENERATED' check (document_status in ('GENERATED','SENT')),
  checklist jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  sent_by uuid,
  sent_at timestamptz,
  unique (booking_id, version)
);
alter table public.journey_confirmation_documents enable row level security;
revoke all on public.journey_confirmation_documents from anon, authenticated;
grant all on public.journey_confirmation_documents to service_role;
create index if not exists journey_confirmation_documents_booking_created_idx
  on public.journey_confirmation_documents (booking_id, created_at desc);
