-- =====================================================
-- 0026: Multi-agency row-level security
-- =====================================================
-- Problem: is_admin() only checks role = 'admin' — no agency scope.
--          Any admin could read/write any other agency's data.
--
-- Fix:
--   1. Ensure cr_clients.created_by is always the agency owner's user ID.
--   2. Re-write every RLS policy to scope through:
--        cr_clients.created_by = public.agency_owner_id()
--      Tables with client_id scope via a JOIN to cr_clients.
--
-- agency_owner_id() already exists (0023). It returns:
--   • For a team member   → their owner's user ID
--   • For an owner / solo admin → auth.uid()
--
-- ⚠️ DATA FIX REQUIRED after applying this migration:
--   Run the following SQL once in the Supabase SQL editor, replacing
--   '<your-admin-user-id>' with the UUID of the first (owner) admin account:
--
--     UPDATE public.cr_clients
--     SET created_by = '<your-admin-user-id>'
--     WHERE created_by IS NULL;
--
-- Until that UPDATE is run, the fallback OR created_by IS NULL clauses keep
-- existing clients visible so the app is not broken.
--
-- ⚠️ SECURITY / SCHEMA CHANGE — requires review by Fran (fran@webmymoney.com)

BEGIN;

-- ── Helper: scoped is_admin ───────────────────────────────────────────────
-- True only when the caller is admin AND the given client belongs to their agency.
CREATE OR REPLACE FUNCTION public.is_agency_admin_for_client(p_client_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT public.is_admin() AND EXISTS (
    SELECT 1 FROM public.cr_clients
    WHERE id = p_client_id
      AND (created_by = public.agency_owner_id() OR created_by IS NULL)
  );
$$;

-- ── cr_clients ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "clients: admin full access" ON public.cr_clients;

CREATE POLICY "clients: admin agency access" ON public.cr_clients
  FOR ALL TO authenticated
  USING  (public.is_admin() AND (created_by = public.agency_owner_id() OR created_by IS NULL))
  WITH CHECK (public.is_admin() AND created_by = public.agency_owner_id());

-- client read-own policy stays as-is (uses can_access_client which joins cr_client_users)

-- ── cr_channel_credentials ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "credentials: admin only"   ON public.cr_channel_credentials;
DROP POLICY IF EXISTS cr_channel_credentials_rls  ON public.cr_channel_credentials;

CREATE POLICY "credentials: admin agency only" ON public.cr_channel_credentials
  FOR ALL TO authenticated
  USING  (public.is_agency_admin_for_client(client_id))
  WITH CHECK (public.is_admin() AND EXISTS (
    SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
  ));

-- ── cr_campaigns ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "campaigns: admin full access" ON public.cr_campaigns;

CREATE POLICY "campaigns: admin agency access" ON public.cr_campaigns
  FOR ALL TO authenticated
  USING  (public.is_agency_admin_for_client(client_id))
  WITH CHECK (public.is_admin() AND EXISTS (
    SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
  ));

-- ── cr_daily_stats ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "daily_stats: admin full access" ON public.cr_daily_stats;

CREATE POLICY "daily_stats: admin agency access" ON public.cr_daily_stats
  FOR ALL TO authenticated
  USING  (public.is_agency_admin_for_client(client_id))
  WITH CHECK (public.is_admin() AND EXISTS (
    SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
  ));

-- ── cr_source_daily ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "source_daily: admin full access" ON public.cr_source_daily;
DROP POLICY IF EXISTS cr_source_daily_admin            ON public.cr_source_daily;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cr_source_daily') THEN
    EXECUTE $q$
      CREATE POLICY "source_daily: admin agency access" ON public.cr_source_daily
        FOR ALL TO authenticated
        USING  (public.is_agency_admin_for_client(client_id))
        WITH CHECK (public.is_admin() AND EXISTS (
          SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
        ));
    $q$;
  END IF;
END $$;

-- ── cr_sync_logs ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "sync_logs: admin only" ON public.cr_sync_logs;

CREATE POLICY "sync_logs: admin agency only" ON public.cr_sync_logs
  FOR ALL TO authenticated
  USING  (public.is_agency_admin_for_client(client_id))
  WITH CHECK (public.is_admin() AND EXISTS (
    SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
  ));

-- ── cr_ads ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cr_ads') THEN
    EXECUTE $q$
      DROP POLICY IF EXISTS cr_ads_admin ON public.cr_ads;
      CREATE POLICY "cr_ads: admin agency access" ON public.cr_ads
        FOR ALL TO authenticated
        USING  (public.is_agency_admin_for_client(client_id))
        WITH CHECK (public.is_admin() AND EXISTS (
          SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
        ));
    $q$;
  END IF;
END $$;

-- ── cr_ad_daily_stats ──────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cr_ad_daily_stats') THEN
    EXECUTE $q$
      DROP POLICY IF EXISTS cr_ad_daily_stats_admin ON public.cr_ad_daily_stats;
      CREATE POLICY "cr_ad_daily_stats: admin agency access" ON public.cr_ad_daily_stats
        FOR ALL TO authenticated
        USING  (public.is_agency_admin_for_client(client_id))
        WITH CHECK (public.is_admin() AND EXISTS (
          SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
        ));
    $q$;
  END IF;
END $$;

-- ── cr_social_snapshots ────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cr_social_snapshots') THEN
    EXECUTE $q$
      DROP POLICY IF EXISTS cr_social_snapshots_admin ON public.cr_social_snapshots;
      CREATE POLICY "cr_social_snapshots: admin agency access" ON public.cr_social_snapshots
        FOR ALL TO authenticated
        USING  (public.is_agency_admin_for_client(client_id))
        WITH CHECK (public.is_admin() AND EXISTS (
          SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
        ));
    $q$;
  END IF;
END $$;

-- ── cr_client_metric_config ────────────────────────────────────────────────
DROP POLICY IF EXISTS "metric_config: admin full access" ON public.cr_client_metric_config;

CREATE POLICY "metric_config: admin agency access" ON public.cr_client_metric_config
  FOR ALL TO authenticated
  USING  (public.is_agency_admin_for_client(client_id))
  WITH CHECK (public.is_admin() AND EXISTS (
    SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
  ));

-- ── cr_client_users ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "client_users: admin full access" ON public.cr_client_users;

CREATE POLICY "client_users: admin agency access" ON public.cr_client_users
  FOR ALL TO authenticated
  USING  (public.is_agency_admin_for_client(client_id))
  WITH CHECK (public.is_admin() AND EXISTS (
    SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
  ));

-- ── cr_reports ─────────────────────────────────────────────────────────────
-- Replace the broad is_admin() restored in 0024 with proper agency scope.
DROP POLICY IF EXISTS cr_reports_admin_all ON public.cr_reports;

CREATE POLICY cr_reports_admin_all ON public.cr_reports
  FOR ALL TO authenticated
  USING  (public.is_agency_admin_for_client(client_id))
  WITH CHECK (public.is_admin() AND EXISTS (
    SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
  ));

-- ── cr_whatsapp_contacts ───────────────────────────────────────────────────
DROP POLICY IF EXISTS cr_whatsapp_contacts_admin ON public.cr_whatsapp_contacts;

CREATE POLICY cr_whatsapp_contacts_admin ON public.cr_whatsapp_contacts
  FOR ALL TO authenticated
  USING  (public.is_agency_admin_for_client(client_id))
  WITH CHECK (public.is_admin() AND EXISTS (
    SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
  ));

-- ── cr_whatsapp_conversations ──────────────────────────────────────────────
DROP POLICY IF EXISTS cr_whatsapp_conversations_admin ON public.cr_whatsapp_conversations;

CREATE POLICY cr_whatsapp_conversations_admin ON public.cr_whatsapp_conversations
  FOR ALL TO authenticated
  USING  (public.is_agency_admin_for_client(client_id))
  WITH CHECK (public.is_admin() AND EXISTS (
    SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
  ));

-- ── cr_whatsapp_messages ───────────────────────────────────────────────────
DROP POLICY IF EXISTS cr_whatsapp_messages_admin ON public.cr_whatsapp_messages;

CREATE POLICY cr_whatsapp_messages_admin ON public.cr_whatsapp_messages
  FOR ALL TO authenticated
  USING  (public.is_agency_admin_for_client(client_id))
  WITH CHECK (public.is_admin() AND EXISTS (
    SELECT 1 FROM public.cr_clients WHERE id = client_id AND created_by = public.agency_owner_id()
  ));

-- ── Index for the hot path ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cr_clients_created_by ON public.cr_clients(created_by);

COMMIT;
