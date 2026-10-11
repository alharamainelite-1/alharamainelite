-- Dedicated role for supplier bookings, quotations, and operational confirmations.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'OPERATIONS_BOOKINGS';
