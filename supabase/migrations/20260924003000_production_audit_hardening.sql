-- Production audit hardening: enforce the 5–8 guest contract at the database layer,
-- add missing FK indexes for the partner commission ledger, and optimize partner RLS.

-- Existing legacy/test rows may contain guest counts below 5. NOT VALID keeps those
-- historical rows intact while enforcing the contract for all new writes.
alter table public.journey_requests drop constraint if exists journey_requests_guest_count_check;
alter table public.journey_requests
  add constraint journey_requests_guest_count_check
  check (guest_count >= 5 and guest_count <= 8) not valid;

alter table public.bookings drop constraint if exists bookings_guest_count_check;
alter table public.bookings
  add constraint bookings_guest_count_check
  check (guest_count >= 5 and guest_count <= 8) not valid;

create index if not exists influencer_commissions_payout_id_idx
  on public.influencer_commissions(payout_id);
create index if not exists influencer_commissions_related_commission_id_idx
  on public.influencer_commissions(related_commission_id);

drop policy if exists influencer_partner_self_select on public.influencer_partners;
create policy influencer_partner_self_select
  on public.influencer_partners
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists influencer_commission_self_select on public.influencer_commissions;
create policy influencer_commission_self_select
  on public.influencer_commissions
  for select
  to authenticated
  using (
    partner_id in (
      select id from public.influencer_partners where user_id = (select auth.uid())
    )
  );

drop policy if exists influencer_payout_self_select on public.influencer_payouts;
create policy influencer_payout_self_select
  on public.influencer_payouts
  for select
  to authenticated
  using (
    partner_id in (
      select id from public.influencer_partners where user_id = (select auth.uid())
    )
  );
