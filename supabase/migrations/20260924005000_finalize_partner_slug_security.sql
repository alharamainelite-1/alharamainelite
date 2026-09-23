-- Finalize partner slug lookup without SECURITY DEFINER or a security-definer view.
drop view if exists public.partner_referral_slugs;
revoke all on table public.influencer_partners from anon;
grant select (slug,status) on table public.influencer_partners to anon;
drop policy if exists influencer_partner_public_slug_lookup on public.influencer_partners;
create policy influencer_partner_public_slug_lookup
  on public.influencer_partners
  for select
  to anon
  using (status in ('PENDING','ACTIVE'));

create or replace function public.partner_slug_exists(p_slug text)
returns boolean
language sql
security invoker
set search_path = public
as $function$
  select exists(
    select 1
    from public.influencer_partners
    where slug = lower(trim(p_slug))
      and status in ('PENDING','ACTIVE')
  );
$function$;

revoke all on function public.partner_slug_exists(text) from public;
grant execute on function public.partner_slug_exists(text) to anon, authenticated;
