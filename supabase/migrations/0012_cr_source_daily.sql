-- =====================================================
-- wmm-client-reporting — cr_source_daily (Phase 2)
-- =====================================================
-- One row per (client, source, date). Universal attribution columns
-- (cost / impressions / clicks / visits / conversions / revenue / reach /
--  engagements) are typed for fast cross-source aggregation; per-source
-- specifics (Instagram followers, Shopify AOV, GHL pipeline_value, Toast
-- covers, Klaviyo unsubscribes, Yotpo review_count, ...) live in `extra`.
--
-- Per-campaign paid detail still lives in cr_campaigns + cr_daily_stats.
-- This table is the source-level rollup the consolidated home view reads.
--
-- The CHECK on source_key is the canonical whitelist for the new naming
-- scheme; migration 0013 brings cr_channel_credentials, cr_campaigns, and
-- cr_daily_stats in line with the same set.

BEGIN;

CREATE TABLE public.cr_source_daily (
  client_id    uuid        NOT NULL REFERENCES public.cr_clients(id) ON DELETE CASCADE,
  source_key   text        NOT NULL,
  date         date        NOT NULL,

  -- Universal attribution columns. All nullable — organic has no cost,
  -- some sources don't report impressions, GHL has no clicks, etc.
  cost         numeric(14,4),
  impressions  bigint,
  clicks       bigint,
  visits       bigint,
  conversions  numeric(14,4),
  revenue      numeric(14,4),
  reach        bigint,
  engagements  bigint,

  -- Per-source extras. Keys vary by source and are the connector's contract.
  extra        jsonb       NOT NULL DEFAULT '{}'::jsonb,

  synced_at    timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (client_id, source_key, date),

  CONSTRAINT cr_source_daily_source_key_check
    CHECK (source_key IN (
      'meta_ads',
      'google_ads',
      'tiktok_ads',
      'meta_page',
      'meta_instagram',
      'linkedin',
      'pinterest',
      'tiktok_organic',
      'youtube',
      'ga4',
      'google_search_console',
      'shopify',
      'ghl',
      'klaviyo',
      'yotpo',
      'toast',
      'email_sms'
    ))
);

CREATE INDEX idx_cr_source_daily_client_date
  ON public.cr_source_daily (client_id, date DESC);

CREATE INDEX idx_cr_source_daily_client_source_date
  ON public.cr_source_daily (client_id, source_key, date DESC);

CREATE INDEX idx_cr_source_daily_source_date
  ON public.cr_source_daily (source_key, date DESC);

ALTER TABLE public.cr_source_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY cr_source_daily_admin_all ON public.cr_source_daily
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY cr_source_daily_client_read ON public.cr_source_daily
  FOR SELECT
  USING (public.can_access_client(client_id));

COMMIT;
