-- Booking-level visa and travel health insurance progress. No passport data is stored.
CREATE TABLE IF NOT EXISTS public.booking_travel_admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  visa_status text NOT NULL DEFAULT 'NOT_STARTED'
    CHECK (visa_status IN ('NOT_STARTED','DOCUMENTS_PENDING','SUBMITTED','UNDER_REVIEW','ISSUED','REJECTED','NOT_REQUIRED')),
  insurance_status text NOT NULL DEFAULT 'NOT_STARTED'
    CHECK (insurance_status IN ('NOT_STARTED','PENDING','ISSUED','NOT_REQUIRED')),
  internal_notes text CHECK (length(coalesce(internal_notes,'')) <= 2000),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_travel_admin_visa_status_idx ON public.booking_travel_admin(visa_status);
CREATE INDEX IF NOT EXISTS booking_travel_admin_insurance_status_idx ON public.booking_travel_admin(insurance_status);
ALTER TABLE public.booking_travel_admin ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.booking_travel_admin FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.booking_travel_admin TO authenticated;
CREATE POLICY booking_travel_admin_staff_read ON public.booking_travel_admin
  FOR SELECT TO authenticated
  USING (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR has_role('OPERATIONS'::app_role) OR has_role('SALES'::app_role));
CREATE POLICY booking_travel_admin_staff_insert ON public.booking_travel_admin
  FOR INSERT TO authenticated
  WITH CHECK (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR has_role('OPERATIONS'::app_role) OR has_role('SALES'::app_role));
CREATE POLICY booking_travel_admin_staff_update ON public.booking_travel_admin
  FOR UPDATE TO authenticated
  USING (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR has_role('OPERATIONS'::app_role) OR has_role('SALES'::app_role))
  WITH CHECK (has_role('SUPER_ADMIN'::app_role) OR has_role('OPERATIONS_MANAGER'::app_role) OR has_role('OPERATIONS'::app_role) OR has_role('SALES'::app_role));
