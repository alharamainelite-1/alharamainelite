-- Staff hierarchy and granular permission overrides.
-- Safe to re-run: enum values and columns are added only when absent.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'MARKETING';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'CUSTOMER_SERVICE';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'OPERATIONS_SUPERVISOR';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_permissions_object_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_permissions_object_check
      CHECK (jsonb_typeof(permissions) = 'object');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_not_self_managed_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_not_self_managed_check
      CHECK (manager_id IS NULL OR manager_id <> id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_manager_id_idx ON public.profiles(manager_id);
CREATE INDEX IF NOT EXISTS profiles_department_idx ON public.profiles(department);

-- Backfill existing staff departments and attach the existing operations manager
-- to the current General Manager without changing any other reporting lines.
UPDATE public.profiles p
SET manager_id = (SELECT s.id FROM public.profiles s WHERE s.role::text = 'SUPER_ADMIN' ORDER BY s.created_at ASC LIMIT 1),
    department = CASE p.role::text
      WHEN 'SUPER_ADMIN' THEN 'GENERAL_MANAGEMENT'
      WHEN 'OPERATIONS_MANAGER' THEN 'OPERATIONS'
      WHEN 'OPERATIONS_SUPERVISOR' THEN 'OPERATIONS'
      WHEN 'JOURNEY_COORDINATOR' THEN 'OPERATIONS'
      WHEN 'OPERATIONS' THEN 'OPERATIONS'
      WHEN 'HOST' THEN 'OPERATIONS'
      WHEN 'SALES' THEN 'SALES'
      WHEN 'MARKETING' THEN 'MARKETING'
      WHEN 'CUSTOMER_SERVICE' THEN 'CUSTOMER_SERVICE'
      WHEN 'FINANCE' THEN 'FINANCE'
      ELSE COALESCE(p.department, 'OPERATIONS')
    END
WHERE p.role::text = 'OPERATIONS_MANAGER'
  AND p.manager_id IS NULL
  AND EXISTS (SELECT 1 FROM public.profiles s WHERE s.role::text = 'SUPER_ADMIN');

UPDATE public.profiles p
SET department = CASE p.role::text
  WHEN 'SUPER_ADMIN' THEN 'GENERAL_MANAGEMENT'
  WHEN 'OPERATIONS_MANAGER' THEN 'OPERATIONS'
  WHEN 'OPERATIONS_SUPERVISOR' THEN 'OPERATIONS'
  WHEN 'JOURNEY_COORDINATOR' THEN 'OPERATIONS'
  WHEN 'OPERATIONS' THEN 'OPERATIONS'
  WHEN 'HOST' THEN 'OPERATIONS'
  WHEN 'SALES' THEN 'SALES'
  WHEN 'MARKETING' THEN 'MARKETING'
  WHEN 'CUSTOMER_SERVICE' THEN 'CUSTOMER_SERVICE'
  WHEN 'FINANCE' THEN 'FINANCE'
  ELSE COALESCE(p.department, 'OPERATIONS')
END
WHERE p.department IS NULL;
