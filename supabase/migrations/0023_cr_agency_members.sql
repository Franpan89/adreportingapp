-- =====================================================
-- 0023: Agency team members (shared access)
-- =====================================================
-- Lets an agency owner (an `admin` profile) add additional team members who
-- share access to the agency's clients, stats, reports and branding.
--
-- Model: there is no separate "agency" entity. An agency is identified by its
-- OWNER admin user id. Members are rows in cr_agency_members linking an
-- auth user (member_user_id) to that owner (owner_user_id).
--
-- Clients / campaigns / daily_stats are already visible to any `admin` via
-- public.is_admin() (see 0002), so a member with the admin role sees them
-- automatically. This migration only re-scopes the two surfaces that were
-- pinned to a single user: cr_reports (created_by) and cr_agency_settings
-- (admin_user_id), so the whole agency shares them.
--
-- NOTE: agency_meta_connections and licenses are intentionally untouched
-- (SaaS surface, slated for a separate app).
--
-- ⚠️ SECURITY / SCHEMA CHANGE — requires review by Fran (fran@webmymoney.com).

BEGIN;

-- ---- members table -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cr_agency_members (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id  uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text        NOT NULL,
  full_name       text,
  role            text        NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status          text        NOT NULL DEFAULT 'active'  CHECK (status IN ('active', 'invited', 'disabled')),
  created_by      uuid        REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_cr_agency_members_owner
  ON public.cr_agency_members (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_cr_agency_members_member
  ON public.cr_agency_members (member_user_id);

-- ---- helper: which agency (owner id) does the current user belong to? ----
-- A member resolves to their owner; everyone else resolves to themselves.
CREATE OR REPLACE FUNCTION public.agency_owner_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT owner_user_id
       FROM public.cr_agency_members
      WHERE member_user_id = auth.uid()
        AND status = 'active'
      LIMIT 1),
    auth.uid()
  );
$$;

-- ---- RLS on the members table ------------------------------------------
ALTER TABLE public.cr_agency_members ENABLE ROW LEVEL SECURITY;

-- The owner manages their own team.
DROP POLICY IF EXISTS cr_agency_members_owner ON public.cr_agency_members;
CREATE POLICY cr_agency_members_owner ON public.cr_agency_members
  FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- A member can read the roster of their own agency.
DROP POLICY IF EXISTS cr_agency_members_read ON public.cr_agency_members;
CREATE POLICY cr_agency_members_read ON public.cr_agency_members
  FOR SELECT TO authenticated
  USING (owner_user_id = public.agency_owner_id());

-- ---- re-scope cr_reports: per-creator -> per-agency --------------------
DROP POLICY IF EXISTS cr_reports_admin_all ON public.cr_reports;
CREATE POLICY cr_reports_admin_all ON public.cr_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cr_clients c
      WHERE c.id = cr_reports.client_id
        AND c.created_by = public.agency_owner_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cr_clients c
      WHERE c.id = cr_reports.client_id
        AND c.created_by = public.agency_owner_id()
    )
  );

-- ---- re-scope cr_agency_settings: per-user -> per-agency ---------------
-- Existing cr_agency_settings_own policy (admin_user_id = auth.uid()) stays;
-- this adds shared access for every member of the agency.
DROP POLICY IF EXISTS cr_agency_settings_agency ON public.cr_agency_settings;
CREATE POLICY cr_agency_settings_agency ON public.cr_agency_settings
  FOR ALL TO authenticated
  USING (admin_user_id = public.agency_owner_id())
  WITH CHECK (admin_user_id = public.agency_owner_id());

COMMIT;
