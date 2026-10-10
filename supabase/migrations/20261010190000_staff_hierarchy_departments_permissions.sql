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
