-- Align journey request storage with the public 1–8 guest contract.
alter table public.journey_requests drop constraint if exists journey_requests_guest_count_check;
alter table public.journey_requests drop constraint if exists journey_requests_guest_count_contract_check;
alter table public.journey_requests add constraint journey_requests_guest_count_check check (guest_count >= 1 and guest_count <= 8) not valid;
alter table public.journey_requests validate constraint journey_requests_guest_count_check;
