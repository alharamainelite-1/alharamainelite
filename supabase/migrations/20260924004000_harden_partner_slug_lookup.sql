-- Remove SECURITY DEFINER from the public referral-slug lookup.
-- The lookup only needs a deliberately public projection of slug/status.
create or replace view public.partner_referral_slugs
with (security_barrier=true)
as
select slug, status
from public.influencer_partners
where status in ('PENDING','ACTIVE');

grant select on public.partner_referral_slugs to anon, authenticated;

create or replace function public.partner_slug_exists(p_slug text)
returns boolean
language sql
security invoker
set search_path = public
as $function$
  select exists(
    select 1
    from public.partner_referral_slugs
    where slug = lower(trim(p_slug))
  );
$function$;

revoke all on function public.partner_slug_exists(text) from public;
grant execute on function public.partner_slug_exists(text) to anon, authenticated;
