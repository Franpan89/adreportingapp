-- =====================================================
-- wmm-client-reporting — add shopify, ghl, gtm channels
-- =====================================================
-- Type system + UI now know about these channels. The CHECK constraints
-- need to allow their channel keys before any cr_channel_credentials /
-- cr_campaigns / cr_daily_stats row can use them.
--
-- Connectors and per-channel column mapping for shopify/ghl/gtm are
-- separate work; this migration is schema-readiness only.

BEGIN;

ALTER TABLE public.cr_channel_credentials DROP CONSTRAINT IF EXISTS cr_channel_credentials_channel_check;
ALTER TABLE public.cr_channel_credentials
  ADD CONSTRAINT cr_channel_credentials_channel_check
  CHECK (channel IN ('meta', 'google', 'tiktok', 'ga4', 'gsc', 'google_ads', 'gtm', 'shopify', 'ghl'));

ALTER TABLE public.cr_campaigns DROP CONSTRAINT IF EXISTS cr_campaigns_channel_check;
ALTER TABLE public.cr_campaigns
  ADD CONSTRAINT cr_campaigns_channel_check
  CHECK (channel IN ('meta', 'google', 'tiktok', 'ga4', 'gsc', 'google_ads', 'gtm', 'shopify', 'ghl'));

ALTER TABLE public.cr_daily_stats DROP CONSTRAINT IF EXISTS cr_daily_stats_channel_check;
ALTER TABLE public.cr_daily_stats
  ADD CONSTRAINT cr_daily_stats_channel_check
  CHECK (channel IN ('meta', 'google', 'tiktok', 'ga4', 'gsc', 'google_ads', 'gtm', 'shopify', 'ghl'));

COMMIT;
