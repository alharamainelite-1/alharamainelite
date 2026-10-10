-- Store generated journey confirmation PDFs privately and link them to the version record.
alter table public.journey_confirmation_documents
  add column if not exists pdf_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('journey-confirmations', 'journey-confirmations', false, 15728640, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = 15728640,
    allowed_mime_types = array['application/pdf'];
