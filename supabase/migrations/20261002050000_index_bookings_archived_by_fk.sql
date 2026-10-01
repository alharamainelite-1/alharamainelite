-- Index the archive actor foreign key to avoid scans when profiles are updated/deleted.
CREATE INDEX IF NOT EXISTS bookings_archived_by_idx
  ON public.bookings (archived_by)
  WHERE archived_by IS NOT NULL;
