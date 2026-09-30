create table if not exists public.departures (
  id uuid primary key default gen_random_uuid(),
  departure_date date not null unique,
  duration_nights integer not null default 9 check (duration_nights between 1 and 30),
  group_size integer not null default 8 check (group_size between 1 and 8),
  max_groups integer null check (max_groups is null or max_groups >= 1),
  status text not null default 'OPEN' check (status in ('OPEN','CLOSED','COMPLETED')),
  public_label text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.journey_requests add column if not exists departure_id uuid references public.departures(id) on delete set null;
alter table public.bookings add column if not exists departure_id uuid references public.departures(id) on delete set null;
alter table public.groups add column if not exists departure_id uuid references public.departures(id) on delete set null;
create index if not exists idx_departures_public on public.departures(status, departure_date);
create index if not exists idx_journey_requests_departure on public.journey_requests(departure_id);
create index if not exists idx_bookings_departure on public.bookings(departure_id);
create index if not exists idx_groups_departure on public.groups(departure_id);
alter table public.departures enable row level security;
drop policy if exists "Public can view open departures" on public.departures;
create policy "Public can view open departures" on public.departures for select to anon, authenticated using (status = 'OPEN' and departure_date >= current_date);
insert into public.departures(departure_date,duration_nights,group_size,max_groups,status,public_label)
values
('2026-10-05',9,8,null,'OPEN','October 5, 2026'),
('2026-10-10',9,8,null,'OPEN','October 10, 2026'),
('2026-10-15',9,8,null,'OPEN','October 15, 2026'),
('2026-10-20',9,8,null,'OPEN','October 20, 2026'),
('2026-10-25',9,8,null,'OPEN','October 25, 2026'),
('2026-11-01',9,8,null,'OPEN','November 1, 2026'),
('2026-11-05',9,8,null,'OPEN','November 5, 2026'),
('2026-11-10',9,8,null,'OPEN','November 10, 2026'),
('2026-11-15',9,8,null,'OPEN','November 15, 2026'),
('2026-11-20',9,8,null,'OPEN','November 20, 2026'),
('2026-11-25',9,8,null,'OPEN','November 25, 2026'),
('2026-11-30',9,8,null,'OPEN','November 30, 2026')
on conflict (departure_date) do nothing;