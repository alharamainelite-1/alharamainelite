alter table public.reviews add column if not exists city text;
create index if not exists idx_reviews_published_verified on public.reviews(status,verified,review_date desc);