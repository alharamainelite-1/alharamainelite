drop policy if exists customers_insert_public on public.customers;
drop policy if exists journey_requests_insert_public on public.journey_requests;
drop policy if exists profiles_admin_manage on public.profiles;
create policy profiles_admin_manage on public.profiles for all to authenticated using (has_role('ADMIN'::app_role)) with check (has_role('ADMIN'::app_role));
drop policy if exists staff_reviews_roles on public.reviews;
create policy staff_reviews_manage on public.reviews for insert to public with check (has_role('SALES'::app_role) or has_role('ADMIN'::app_role));
create policy staff_reviews_update on public.reviews for update to public using (has_role('SALES'::app_role) or has_role('ADMIN'::app_role)) with check (has_role('SALES'::app_role) or has_role('ADMIN'::app_role));
create policy staff_reviews_delete on public.reviews for delete to public using (has_role('SALES'::app_role) or has_role('ADMIN'::app_role));
