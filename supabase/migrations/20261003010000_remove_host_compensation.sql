-- Host compensation is handled outside the platform. Keep task operations only.
drop trigger if exists host_task_earning_sync on public.host_tasks;
drop trigger if exists host_task_rate_snapshot on public.host_tasks;
drop trigger if exists host_task_rate_immutable on public.host_tasks;
drop trigger if exists host_earning_update_guard on public.host_earnings;

drop function if exists public.sync_host_earning();
drop function if exists public.snapshot_host_task_rate();
drop function if exists public.guard_host_task_rate_snapshot();
drop function if exists public.guard_host_earning_update();

drop table if exists public.host_earnings;
drop table if exists public.host_task_catalog;

alter table public.host_tasks
  drop column if exists rate_snapshot,
  drop column if exists rate_currency,
  drop column if exists rate_catalog_id;
