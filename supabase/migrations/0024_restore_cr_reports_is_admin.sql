-- =====================================================
-- 0024: Restore cr_reports admin policy to is_admin()
-- =====================================================
-- Migration 0023 re-scoped cr_reports to `c.created_by = agency_owner_id()`.
-- All cr_clients rows were created via the service role with created_by = NULL,
-- so that predicate is NULL = uuid -> FALSE for everyone, including the owner.
-- Result: reports returned 0 rows for the entire agency.
--
-- This is the exact failure 0018 already fixed by switching to is_admin().
-- Members provisioned by the team feature are `admin` profiles, so is_admin()
-- already shares reports across the whole agency. Restore it.
--
-- ⚠️ SECURITY / SCHEMA CHANGE — requires review by Fran (fran@webmymoney.com).

BEGIN;

DROP POLICY IF EXISTS cr_reports_admin_all ON public.cr_reports;
CREATE POLICY cr_reports_admin_all ON public.cr_reports
  FOR ALL TO authenticated
  USING     (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;
