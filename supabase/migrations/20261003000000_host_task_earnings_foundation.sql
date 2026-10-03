-- Host task pricing snapshots and controlled host earnings.
create table if not exists public.host_task_catalog (
  id uuid primary key default gen_random_uuid(),
  task_type text not null unique,
  title text not null,
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null default 'USD' check (currency in ('USD','SAR')),
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.host_tasks
  add column if not exists rate_snapshot numeric(12,2),
  add column if not exists rate_currency char(3),
  add column if not exists rate_catalog_id uuid references public.host_task_catalog(id),
  add column if not exists assigned_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

create table if not exists public.host_earnings (
  id uuid primary key default gen_random_uuid(),
  host_task_id uuid not null unique references public.host_tasks(id),
  host_id uuid not null references public.hosts(id),
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null check (currency in ('USD','SAR')),
  status text not null default 'PENDING_REVIEW'
    check (status in ('PENDING_REVIEW','APPROVED','REJECTED','PAID','VOID')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  paid_by uuid references public.profiles(id),
  paid_at timestamptz,
  payment_reference text,
  finance_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status <> 'PAID') or (paid_by is not null and paid_at is not null))
);

create index if not exists host_earnings_host_status_idx on public.host_earnings(host_id,status);
create index if not exists host_tasks_host_date_idx on public.host_tasks(host_id,date);

alter table public.host_task_catalog enable row level security;
alter table public.host_earnings enable row level security;

drop policy if exists host_task_catalog_read_management on public.host_task_catalog;
create policy host_task_catalog_read_management on public.host_task_catalog
for select to authenticated using (
  public.has_role('SUPER_ADMIN'::public.app_role)
  or public.has_role('FINANCE'::public.app_role)
  or public.has_role('OPERATIONS_MANAGER'::public.app_role)
  or public.has_role('OPERATIONS'::public.app_role)
);
drop policy if exists host_task_catalog_write_management on public.host_task_catalog;
create policy host_task_catalog_write_management on public.host_task_catalog
for all to authenticated using (
  public.has_role('SUPER_ADMIN'::public.app_role)
  or public.has_role('FINANCE'::public.app_role)
) with check (
  public.has_role('SUPER_ADMIN'::public.app_role)
  or public.has_role('FINANCE'::public.app_role)
);

drop policy if exists host_earnings_finance_read on public.host_earnings;
create policy host_earnings_finance_read on public.host_earnings
for select to authenticated using (
  public.has_role('SUPER_ADMIN'::public.app_role)
  or public.has_role('FINANCE'::public.app_role)
);
drop policy if exists host_earnings_finance_write on public.host_earnings;
create policy host_earnings_finance_write on public.host_earnings
for all to authenticated using (
  public.has_role('SUPER_ADMIN'::public.app_role)
  or public.has_role('FINANCE'::public.app_role)
) with check (
  public.has_role('SUPER_ADMIN'::public.app_role)
  or public.has_role('FINANCE'::public.app_role)
);

create or replace function public.snapshot_host_task_rate()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare catalog_row public.host_task_catalog%rowtype;
begin
  if tg_op = 'INSERT' then
    if new.host_id is not null then
      select * into catalog_row from public.host_task_catalog
        where task_type = new.task_type and active = true;
      if found then
        new.rate_snapshot := catalog_row.amount;
        new.rate_currency := catalog_row.currency;
        new.rate_catalog_id := catalog_row.id;
      end if;
      new.assigned_at := coalesce(new.assigned_at, now());
    end if;
  elsif new.host_id is distinct from old.host_id
     or new.task_type is distinct from old.task_type then
    if old.host_id is not null and old.rate_snapshot is not null then
      raise exception 'Assigned task pricing is immutable; create a new task to change host or task type';
    end if;
    if new.host_id is not null then
      select * into catalog_row from public.host_task_catalog
        where task_type = new.task_type and active = true;
      if not found then
        raise exception 'No active host task price is configured for task type %', new.task_type;
      end if;
      new.rate_snapshot := catalog_row.amount;
      new.rate_currency := catalog_row.currency;
      new.rate_catalog_id := catalog_row.id;
      new.assigned_at := now();
    else
      new.rate_snapshot := null;
      new.rate_currency := null;
      new.rate_catalog_id := null;
      new.assigned_at := null;
    end if;
  end if;
  if new.status = 'IN_PROGRESS' and old.status is distinct from new.status then
    new.started_at := coalesce(new.started_at,now());
  end if;
  if new.status = 'COMPLETED' and old.status is distinct from new.status then
    new.completed_at := coalesce(new.completed_at,now());
  end if;
  return new;
end;
$$;
revoke all on function public.snapshot_host_task_rate() from public, anon, authenticated;
drop trigger if exists host_task_rate_snapshot on public.host_tasks;
create trigger host_task_rate_snapshot before insert or update on public.host_tasks
for each row execute function public.snapshot_host_task_rate();

create or replace function public.sync_host_earning()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'COMPLETED' and new.host_id is not null
     and new.rate_snapshot is not null and new.rate_currency is not null then
    insert into public.host_earnings(host_task_id,host_id,amount,currency)
    values(new.id,new.host_id,new.rate_snapshot,new.rate_currency)
    on conflict(host_task_id) do nothing;
  elsif new.status = 'CANCELLED' then
    update public.host_earnings set status='VOID',updated_at=now()
      where host_task_id=new.id and status='PENDING_REVIEW';
  end if;
  return new;
end;
$$;
revoke all on function public.sync_host_earning() from public, anon, authenticated;
drop trigger if exists host_task_earning_sync on public.host_tasks;
create trigger host_task_earning_sync after insert or update of status on public.host_tasks
for each row execute function public.sync_host_earning();

-- Notification queue stores operational events only; delivery is handled by a trusted server worker.
create table if not exists public.host_task_notification_queue (
  id uuid primary key default gen_random_uuid(),
  host_task_id uuid not null references public.host_tasks(id) on delete cascade,
  host_id uuid not null references public.hosts(id),
  event_type text not null check (event_type in ('ASSIGNED','RESCHEDULED','CANCELLED')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING','SENT','FAILED')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.host_task_notification_queue enable row level security;
drop policy if exists host_task_notification_management_read on public.host_task_notification_queue;
create policy host_task_notification_management_read on public.host_task_notification_queue
for select to authenticated using (
  public.has_role('SUPER_ADMIN'::public.app_role)
  or public.has_role('FINANCE'::public.app_role)
  or public.has_role('OPERATIONS_MANAGER'::public.app_role)
  or public.has_role('OPERATIONS'::public.app_role)
);
drop policy if exists host_task_notification_management_write on public.host_task_notification_queue;
create policy host_task_notification_management_write on public.host_task_notification_queue
for all to authenticated using (
  public.has_role('SUPER_ADMIN'::public.app_role)
  or public.has_role('OPERATIONS_MANAGER'::public.app_role)
  or public.has_role('OPERATIONS'::public.app_role)
) with check (
  public.has_role('SUPER_ADMIN'::public.app_role)
  or public.has_role('OPERATIONS_MANAGER'::public.app_role)
  or public.has_role('OPERATIONS'::public.app_role)
);

create or replace function public.queue_host_task_notice()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare event_name text;
begin
  if tg_op = 'INSERT' then
    if new.host_id is not null then event_name := 'ASSIGNED'; end if;
  elsif new.host_id is distinct from old.host_id then
    if new.host_id is not null then event_name := 'ASSIGNED'; end if;
  elsif new.status = 'CANCELLED' and old.status is distinct from new.status then
    event_name := 'CANCELLED';
  elsif new.date is distinct from old.date or new.start_time is distinct from old.start_time
     or new.end_time is distinct from old.end_time then
    if new.host_id is not null then event_name := 'RESCHEDULED'; end if;
  end if;
  if event_name is not null then
    insert into public.host_task_notification_queue(host_task_id,host_id,event_type,payload)
    values(new.id,new.host_id,event_name,jsonb_build_object('task_id',new.task_id,'date',new.date,'start_time',new.start_time,'end_time',new.end_time,'task_type',new.task_type));
  end if;
  return new;
end;
$$;
revoke all on function public.queue_host_task_notice() from public, anon, authenticated;
drop trigger if exists host_task_notice_queue on public.host_tasks;
create trigger host_task_notice_queue after insert or update on public.host_tasks
for each row execute function public.queue_host_task_notice();
