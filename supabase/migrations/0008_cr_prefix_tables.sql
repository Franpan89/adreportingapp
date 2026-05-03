-- =====================================================
-- wmm-client-reporting — cr_ prefix for reporting tables
-- =====================================================
-- Reporting-core tables get the `cr_` prefix to namespace this app's
-- domain on the shared WMM Supabase project.
--
-- Tables NOT renamed (intentional):
--   - profiles                  — auth cross-cutting, used by Supabase trigger
--   - licenses                  — SaaS surface, slated for separate app
--   - agency_meta_connections   — SaaS-bound agency Meta token store
--
-- Foreign-key constraints follow renames automatically (Postgres tracks by OID).
-- Helper functions and policies that reference renamed tables by name are
-- recreated below.

BEGIN;

-- ---- rename tables -----------------------------------------------------
ALTER TABLE public.clients              RENAME TO cr_clients;
ALTER TABLE public.client_users         RENAME TO cr_client_users;
ALTER TABLE public.metric_definitions   RENAME TO cr_metric_definitions;
ALTER TABLE public.client_metric_config RENAME TO cr_client_metric_config;
ALTER TABLE public.channel_credentials  RENAME TO cr_channel_credentials;
ALTER TABLE public.campaigns            RENAME TO cr_campaigns;
ALTER TABLE public.daily_stats          RENAME TO cr_daily_stats;
ALTER TABLE public.sync_logs            RENAME TO cr_sync_logs;
ALTER TABLE public.reports              RENAME TO cr_reports;

-- ---- rename indexes ----------------------------------------------------
ALTER INDEX IF EXISTS public.idx_daily_stats_client_date  RENAME TO idx_cr_daily_stats_client_date;
ALTER INDEX IF EXISTS public.idx_daily_stats_campaign     RENAME TO idx_cr_daily_stats_campaign;
ALTER INDEX IF EXISTS public.idx_daily_stats_channel_date RENAME TO idx_cr_daily_stats_channel_date;
ALTER INDEX IF EXISTS public.reports_client_id_idx        RENAME TO cr_reports_client_id_idx;
ALTER INDEX IF EXISTS public.reports_status_idx           RENAME TO cr_reports_status_idx;

-- ---- recreate helper that referenced client_users by name --------------
CREATE OR REPLACE FUNCTION public.can_access_client(p_client_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cr_client_users
      WHERE cr_client_users.client_id = p_client_id
        AND cr_client_users.user_id   = auth.uid()
    );
$$;

-- ---- recreate cr_reports policies (referenced clients/client_users) ----
DROP POLICY IF EXISTS reports_admin_all     ON public.cr_reports;
DROP POLICY IF EXISTS reports_client_select ON public.cr_reports;

CREATE POLICY cr_reports_admin_all ON public.cr_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cr_clients c
      WHERE c.id = cr_reports.client_id AND c.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cr_clients c
      WHERE c.id = cr_reports.client_id AND c.created_by = auth.uid()
    )
  );

CREATE POLICY cr_reports_client_select ON public.cr_reports
  FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.cr_client_users cu
      WHERE cu.client_id = cr_reports.client_id AND cu.user_id = auth.uid()
    )
  );

-- ---- recreate trigger on the renamed reports table ---------------------
DROP TRIGGER IF EXISTS reports_updated_at ON public.cr_reports;
CREATE TRIGGER cr_reports_updated_at
  BEFORE UPDATE ON public.cr_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMIT;
