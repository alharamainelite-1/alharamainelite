-- ALHARAMAINELITE production security and journey workflow
-- Applied after 001_initial.sql.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'OPERATIONS_MANAGER';

CREATE SEQUENCE IF NOT EXISTS public.booking_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.request_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('SUPER_ADMIN','ADMIN','OPERATIONS_MANAGER','OPERATIONS','SALES','FINANCE')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = required_role OR p.role = 'SUPER_ADMIN')
  );
$$;

CREATE OR REPLACE FUNCTION public.create_journey_request(
  p_full_name text,
  p_whatsapp text,
  p_email text,
  p_country text,
  p_city text,
  p_preferred_language text,
  p_package_slug text,
  p_guest_count integer,
  p_expected_travel_date date,
  p_expected_period_start date,
  p_expected_period_end date,
  p_expected_period_label text,
  p_additional_notes text
)
RETURNS TABLE (
  reference text,
  booking_id text,
  estimated_total numeric,
  currency char(3)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package public.packages%ROWTYPE;
  v_customer_id uuid;
  v_request_id uuid;
  v_reference text;
  v_booking_id text;
  v_total numeric(12,2);
BEGIN
  IF p_guest_count < 1 OR p_guest_count > 8 THEN
    RAISE EXCEPTION 'Invalid guest count';
  END IF;

  IF p_preferred_language NOT IN ('en','so','ar') THEN
    RAISE EXCEPTION 'Invalid language';
  END IF;

  SELECT *
    INTO v_package
    FROM public.packages
   WHERE slug = p_package_slug
     AND active = true
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected package is unavailable';
  END IF;

  v_total := v_package.price * p_guest_count;

  SELECT id
    INTO v_customer_id
    FROM public.customers
   WHERE whatsapp = p_whatsapp
   ORDER BY created_at DESC
   LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers(full_name, whatsapp, email, country, city, preferred_language)
    VALUES (p_full_name, p_whatsapp, NULLIF(p_email,''), p_country, NULLIF(p_city,''), p_preferred_language)
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
       SET full_name = p_full_name,
           email = COALESCE(NULLIF(p_email,''), email),
           country = p_country,
           city = NULLIF(p_city,''),
           preferred_language = p_preferred_language,
           updated_at = now()
     WHERE id = v_customer_id;
  END IF;

  v_reference := 'HE-' || to_char(current_date, 'YYYY') || '-' ||
    lpad(nextval('public.request_number_seq')::text, 5, '0');

  INSERT INTO public.journey_requests(
    reference, customer_id, package_id, guest_count,
    expected_travel_date, expected_period_start, expected_period_end,
    expected_period_label, estimated_total, currency, additional_notes
  )
  VALUES (
    v_reference, v_customer_id, v_package.id, p_guest_count,
    p_expected_travel_date, p_expected_period_start, p_expected_period_end,
    NULLIF(p_expected_period_label,''), v_total, v_package.currency, NULLIF(p_additional_notes,'')
  )
  RETURNING id INTO v_request_id;

  v_booking_id := 'HE-' || to_char(current_date, 'YYYY') || '-' ||
    lpad(nextval('public.booking_number_seq')::text, 5, '0');

  INSERT INTO public.bookings(
    booking_id, request_id, customer_id, package_id, guest_count,
    total_amount, currency, status, payment_status,
    expected_travel_date, expected_period_start, expected_period_end, notes
  )
  VALUES (
    v_booking_id, v_request_id, v_customer_id, v_package.id, p_guest_count,
    v_total, v_package.currency, 'NEW_REQUEST', 'NOT_REQUESTED',
    p_expected_travel_date, p_expected_period_start, p_expected_period_end,
    NULLIF(p_additional_notes,'')
  );

  RETURN QUERY SELECT v_reference, v_booking_id, v_total, v_package.currency;
END;
$$;

REVOKE ALL ON FUNCTION public.create_journey_request(text,text,text,text,text,text,text,integer,date,date,date,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_journey_request(text,text,text,text,text,text,text,integer,date,date,date,text,text) TO anon, authenticated;

-- Replace the overly broad "any authenticated profile is staff" policies.
DROP POLICY IF EXISTS staff_profiles ON public.profiles;
DROP POLICY IF EXISTS staff_customers ON public.customers;
DROP POLICY IF EXISTS staff_requests ON public.journey_requests;
DROP POLICY IF EXISTS staff_bookings ON public.bookings;
DROP POLICY IF EXISTS staff_booking_guests ON public.booking_guests;
DROP POLICY IF EXISTS staff_groups ON public.groups;
DROP POLICY IF EXISTS staff_group_members ON public.group_members;
DROP POLICY IF EXISTS staff_hosts ON public.hosts;
DROP POLICY IF EXISTS staff_host_availability ON public.host_availability;
DROP POLICY IF EXISTS staff_hotels ON public.hotels;
DROP POLICY IF EXISTS staff_hotel_assignments ON public.hotel_assignments;
DROP POLICY IF EXISTS staff_drivers ON public.drivers;
DROP POLICY IF EXISTS staff_vehicles ON public.vehicles;
DROP POLICY IF EXISTS staff_train ON public.train_bookings;
DROP POLICY IF EXISTS staff_activities ON public.activities;
DROP POLICY IF EXISTS staff_booking_activities ON public.booking_activities;
DROP POLICY IF EXISTS staff_host_tasks ON public.host_tasks;
DROP POLICY IF EXISTS staff_operations_tasks ON public.operations_tasks;
DROP POLICY IF EXISTS staff_payments ON public.payments;
DROP POLICY IF EXISTS staff_expenses ON public.expenses;
DROP POLICY IF EXISTS staff_templates ON public.communication_templates;
DROP POLICY IF EXISTS staff_logs ON public.communication_logs;
DROP POLICY IF EXISTS staff_reviews ON public.reviews;
DROP POLICY IF EXISTS staff_audit ON public.audit_logs;
DROP POLICY IF EXISTS staff_settings ON public.site_settings;

CREATE POLICY profiles_self_or_admin ON public.profiles
FOR SELECT USING (id = auth.uid() OR public.has_role('ADMIN'));

CREATE POLICY profiles_admin_manage ON public.profiles
FOR ALL USING (public.has_role('ADMIN'));

CREATE POLICY sales_customers ON public.customers
FOR ALL USING (public.has_role('SALES') OR public.has_role('ADMIN'));

CREATE POLICY sales_requests ON public.journey_requests
FOR ALL USING (public.has_role('SALES') OR public.has_role('ADMIN'));

CREATE POLICY staff_bookings_roles ON public.bookings
FOR ALL USING (public.has_role('SALES') OR public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('FINANCE') OR public.has_role('ADMIN'));

CREATE POLICY operations_booking_guests ON public.booking_guests
FOR ALL USING (public.has_role('SALES') OR public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY operations_groups ON public.groups
FOR ALL USING (public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY operations_group_members ON public.group_members
FOR ALL USING (public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY operations_hosts ON public.hosts
FOR ALL USING (public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY operations_host_availability ON public.host_availability
FOR ALL USING (public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY operations_hotels ON public.hotels
FOR ALL USING (public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY operations_hotel_assignments ON public.hotel_assignments
FOR ALL USING (public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY operations_drivers ON public.drivers
FOR ALL USING (public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY operations_vehicles ON public.vehicles
FOR ALL USING (public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY operations_train ON public.train_bookings
FOR ALL USING (public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY operations_activities ON public.activities
FOR ALL USING (public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY operations_booking_activities ON public.booking_activities
FOR ALL USING (public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY operations_host_tasks ON public.host_tasks
FOR ALL USING (public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY operations_tasks ON public.operations_tasks
FOR ALL USING (public.has_role('OPERATIONS') OR public.has_role('OPERATIONS_MANAGER') OR public.has_role('ADMIN'));

CREATE POLICY finance_payments ON public.payments
FOR ALL USING (public.has_role('FINANCE') OR public.has_role('ADMIN'));

CREATE POLICY finance_expenses ON public.expenses
FOR ALL USING (public.has_role('FINANCE') OR public.has_role('ADMIN'));

CREATE POLICY staff_templates_roles ON public.communication_templates
FOR ALL USING (public.has_role('SALES') OR public.has_role('ADMIN'));

CREATE POLICY staff_logs_roles ON public.communication_logs
FOR ALL USING (public.has_role('SALES') OR public.has_role('ADMIN'));

CREATE POLICY staff_reviews_roles ON public.reviews
FOR ALL USING (public.has_role('SALES') OR public.has_role('ADMIN'));

CREATE POLICY staff_audit_admin ON public.audit_logs
FOR SELECT USING (public.has_role('ADMIN'));

CREATE POLICY staff_settings_admin ON public.site_settings
FOR ALL USING (public.has_role('ADMIN'));

-- Only administrators can promote a profile to another staff role.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role AND NOT public.has_role('ADMIN') THEN
    RAISE EXCEPTION 'Only administrators may change staff roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();
