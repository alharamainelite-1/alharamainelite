-- Allow customer journey confirmation documents to be issued in Somali.
alter table public.journey_confirmation_documents
  drop constraint if exists journey_confirmation_documents_language_check;
alter table public.journey_confirmation_documents
  add constraint journey_confirmation_documents_language_check
  check (language in ('ar','en','so'));
