-- =====================================================
-- AdPulse — SaaS Licenses & Super Admin Role
-- =====================================================

-- 1. Extend profiles.role to include super_admin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'client', 'super_admin'));

-- 2. Helper: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- 3. Update is_admin so super_admin also passes admin-level checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- 4. Licenses table
CREATE TABLE IF NOT EXISTS public.licenses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name     TEXT        NOT NULL,
  agency_email    TEXT        NOT NULL,
  plan_id         TEXT        NOT NULL CHECK (plan_id IN ('starter', 'pro', 'enterprise')),
  status          TEXT        NOT NULL DEFAULT 'trial'
                              CHECK (status IN ('active', 'suspended', 'expired', 'trial')),
  expires_at      TIMESTAMPTZ,
  notes           TEXT,
  temp_password   TEXT,
  clients_count   INTEGER     NOT NULL DEFAULT 0,
  agency_user_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by      UUID        REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. updated_at auto-trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS licenses_updated_at ON public.licenses;
CREATE TRIGGER licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 6. RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Super admin can do everything
CREATE POLICY "licenses: super_admin full access"
  ON public.licenses FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Agency admins can read their own license (matched by email)
CREATE POLICY "licenses: agency admin read own"
  ON public.licenses FOR SELECT
  USING (
    public.is_admin()
    AND agency_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );
