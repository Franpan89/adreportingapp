-- =====================================================
-- wmm-client-reporting — migrate channel='google' → 'google_ads'
-- =====================================================
-- The original AdPulse schema used `google` for the Google Ads channel.
-- Consolidation introduced the explicit `google_ads` key. This migration:
--   1. Updates every existing row in cr_channel_credentials, cr_campaigns,
--      cr_daily_stats from channel='google' to channel='google_ads'.
--   2. Tightens the channel CHECK constraints to remove 'google' entirely.
--
-- Also handles the cr_channel_credentials uniqueness corner case: a client
-- could (in theory) have BOTH a 'google' row and a 'google_ads' row. The
-- update would violate UNIQUE(client_id, channel). Defensive: delete the
-- 'google' row in that case (the 'google_ads' row is the canonical one).

BEGIN;

-- 1. Resolve the uniqueness collision before the bulk update.
DELETE FROM public.cr_channel_credentials
  WHERE channel = 'google'
    AND (client_id, 'google_ads')
        IN (SELECT client_id, channel FROM public.cr_channel_credentials WHERE channel = 'google_ads');

-- Same defensive collision check for cr_campaigns (UNIQUE client_id, channel, external_id).
DELETE FROM public.cr_campaigns
  WHERE channel = 'google'
    AND (client_id, 'google_ads', external_id)
        IN (SELECT client_id, channel, external_id FROM public.cr_campaigns WHERE channel = 'google_ads');

-- 2. Bulk migrate the channel value.
UPDATE public.cr_channel_credentials SET channel = 'google_ads' WHERE channel = 'google';
UPDATE public.cr_campaigns           SET channel = 'google_ads' WHERE channel = 'google';
UPDATE public.cr_daily_stats         SET channel = 'google_ads' WHERE channel = 'google';

-- 3. Tighten CHECK constraints — drop 'google' from the whitelist.
ALTER TABLE public.cr_channel_credentials DROP CONSTRAINT IF EXISTS cr_channel_credentials_channel_check;
ALTER TABLE public.cr_channel_credentials
  ADD CONSTRAINT cr_channel_credentials_channel_check
  CHECK (channel IN ('meta', 'tiktok', 'ga4', 'gsc', 'google_ads', 'gtm', 'shopify', 'ghl'));

ALTER TABLE public.cr_campaigns DROP CONSTRAINT IF EXISTS cr_campaigns_channel_check;
ALTER TABLE public.cr_campaigns
  ADD CONSTRAINT cr_campaigns_channel_check
  CHECK (channel IN ('meta', 'tiktok', 'ga4', 'gsc', 'google_ads', 'gtm', 'shopify', 'ghl'));

ALTER TABLE public.cr_daily_stats DROP CONSTRAINT IF EXISTS cr_daily_stats_channel_check;
ALTER TABLE public.cr_daily_stats
  ADD CONSTRAINT cr_daily_stats_channel_check
  CHECK (channel IN ('meta', 'tiktok', 'ga4', 'gsc', 'google_ads', 'gtm', 'shopify', 'ghl'));

COMMIT;
