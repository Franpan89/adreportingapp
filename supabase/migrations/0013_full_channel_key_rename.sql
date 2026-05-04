-- =====================================================
-- wmm-client-reporting — full channel key rename (Phase 2)
-- =====================================================
-- Bring cr_channel_credentials, cr_campaigns, cr_daily_stats in line with
-- the source_key whitelist used by cr_source_daily (migration 0012).
--
-- Renames:
--   meta   → meta_ads
--   google → google_ads     (defensive — 0011 should have cleared 'google' rows)
--   tiktok → tiktok_ads
--   gsc    → google_search_console
--
-- Drops:
--   gtm  — was added in 0010 for type-system readiness; not in the canonical
--          source list and no production data uses it. Will return as a future
--          migration if/when the GTM connector ships.
--
-- Adds (new keys allowed by the CHECK constraints):
--   meta_page, meta_instagram, linkedin, pinterest, tiktok_organic, youtube,
--   klaviyo, yotpo, toast, email_sms
--
-- Defensive collision deletes for the UNIQUE-constraint corner case where a
-- client has both an old-key row and an already-renamed-key row in either
-- cr_channel_credentials (UNIQUE client_id, channel) or cr_campaigns
-- (UNIQUE client_id, channel, external_id). The new-key row is canonical;
-- the old-key row is dropped.

BEGIN;

-- ---- cr_channel_credentials -----------------------------------------------

DELETE FROM public.cr_channel_credentials
  WHERE channel = 'meta'
    AND (client_id, 'meta_ads')
        IN (SELECT client_id, channel FROM public.cr_channel_credentials WHERE channel = 'meta_ads');

DELETE FROM public.cr_channel_credentials
  WHERE channel = 'tiktok'
    AND (client_id, 'tiktok_ads')
        IN (SELECT client_id, channel FROM public.cr_channel_credentials WHERE channel = 'tiktok_ads');

DELETE FROM public.cr_channel_credentials
  WHERE channel = 'gsc'
    AND (client_id, 'google_search_console')
        IN (SELECT client_id, channel FROM public.cr_channel_credentials WHERE channel = 'google_search_console');

UPDATE public.cr_channel_credentials SET channel = 'meta_ads'              WHERE channel = 'meta';
UPDATE public.cr_channel_credentials SET channel = 'google_ads'            WHERE channel = 'google';
UPDATE public.cr_channel_credentials SET channel = 'tiktok_ads'            WHERE channel = 'tiktok';
UPDATE public.cr_channel_credentials SET channel = 'google_search_console' WHERE channel = 'gsc';

DELETE FROM public.cr_channel_credentials WHERE channel = 'gtm';

ALTER TABLE public.cr_channel_credentials DROP CONSTRAINT IF EXISTS cr_channel_credentials_channel_check;
ALTER TABLE public.cr_channel_credentials
  ADD CONSTRAINT cr_channel_credentials_channel_check
  CHECK (channel IN (
    'meta_ads', 'google_ads', 'tiktok_ads',
    'meta_page', 'meta_instagram', 'linkedin', 'pinterest', 'tiktok_organic', 'youtube',
    'ga4', 'google_search_console',
    'shopify', 'ghl', 'klaviyo', 'yotpo', 'toast', 'email_sms'
  ));

-- ---- cr_campaigns ---------------------------------------------------------

DELETE FROM public.cr_campaigns
  WHERE channel = 'meta'
    AND (client_id, 'meta_ads', external_id)
        IN (SELECT client_id, channel, external_id FROM public.cr_campaigns WHERE channel = 'meta_ads');

DELETE FROM public.cr_campaigns
  WHERE channel = 'tiktok'
    AND (client_id, 'tiktok_ads', external_id)
        IN (SELECT client_id, channel, external_id FROM public.cr_campaigns WHERE channel = 'tiktok_ads');

UPDATE public.cr_campaigns SET channel = 'meta_ads'   WHERE channel = 'meta';
UPDATE public.cr_campaigns SET channel = 'google_ads' WHERE channel = 'google';
UPDATE public.cr_campaigns SET channel = 'tiktok_ads' WHERE channel = 'tiktok';

DELETE FROM public.cr_campaigns WHERE channel = 'gtm';

ALTER TABLE public.cr_campaigns DROP CONSTRAINT IF EXISTS cr_campaigns_channel_check;
ALTER TABLE public.cr_campaigns
  ADD CONSTRAINT cr_campaigns_channel_check
  CHECK (channel IN (
    'meta_ads', 'google_ads', 'tiktok_ads',
    'meta_page', 'meta_instagram', 'linkedin', 'pinterest', 'tiktok_organic', 'youtube',
    'ga4', 'google_search_console',
    'shopify', 'ghl', 'klaviyo', 'yotpo', 'toast', 'email_sms'
  ));

-- ---- cr_daily_stats -------------------------------------------------------

UPDATE public.cr_daily_stats SET channel = 'meta_ads'   WHERE channel = 'meta';
UPDATE public.cr_daily_stats SET channel = 'google_ads' WHERE channel = 'google';
UPDATE public.cr_daily_stats SET channel = 'tiktok_ads' WHERE channel = 'tiktok';

DELETE FROM public.cr_daily_stats WHERE channel = 'gtm';

ALTER TABLE public.cr_daily_stats DROP CONSTRAINT IF EXISTS cr_daily_stats_channel_check;
ALTER TABLE public.cr_daily_stats
  ADD CONSTRAINT cr_daily_stats_channel_check
  CHECK (channel IN (
    'meta_ads', 'google_ads', 'tiktok_ads',
    'meta_page', 'meta_instagram', 'linkedin', 'pinterest', 'tiktok_organic', 'youtube',
    'ga4', 'google_search_console',
    'shopify', 'ghl', 'klaviyo', 'yotpo', 'toast', 'email_sms'
  ));

COMMIT;
