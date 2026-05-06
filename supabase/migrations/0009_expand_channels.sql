-- =====================================================
-- wmm-client-reporting — expand channel CHECK constraints
-- =====================================================
-- The initial schema (0001) only allowed channel IN ('meta','google','tiktok').
-- Consolidation adds:
--   ga4         — Google Analytics 4 (organic + paid sessions)
--   gsc         — Google Search Console (organic search)
--   google_ads  — explicit Google Ads channel (separate from the legacy 'google')
--
-- Existing rows with channel='google' are left untouched. Whether to migrate
-- 'google' → 'google_ads' is a separate decision; the schema now accepts both.
--
-- Constraint names from CREATE TABLE without explicit names follow the original
-- table name and persist through the cr_ rename, so we drop both possible names.

BEGIN;

-- ---- cr_channel_credentials -------------------------------------------
ALTER TABLE public.cr_channel_credentials DROP CONSTRAINT IF EXISTS channel_credentials_channel_check;
ALTER TABLE public.cr_channel_credentials DROP CONSTRAINT IF EXISTS cr_channel_credentials_channel_check;
ALTER TABLE public.cr_channel_credentials
  ADD CONSTRAINT cr_channel_credentials_channel_check
  CHECK (channel IN ('meta', 'google', 'tiktok', 'ga4', 'gsc', 'google_ads'));

-- ---- cr_campaigns ------------------------------------------------------
ALTER TABLE public.cr_campaigns DROP CONSTRAINT IF EXISTS campaigns_channel_check;
ALTER TABLE public.cr_campaigns DROP CONSTRAINT IF EXISTS cr_campaigns_channel_check;
ALTER TABLE public.cr_campaigns
  ADD CONSTRAINT cr_campaigns_channel_check
  CHECK (channel IN ('meta', 'google', 'tiktok', 'ga4', 'gsc', 'google_ads'));

-- ---- cr_daily_stats ----------------------------------------------------
ALTER TABLE public.cr_daily_stats DROP CONSTRAINT IF EXISTS daily_stats_channel_check;
ALTER TABLE public.cr_daily_stats DROP CONSTRAINT IF EXISTS cr_daily_stats_channel_check;
ALTER TABLE public.cr_daily_stats
  ADD CONSTRAINT cr_daily_stats_channel_check
  CHECK (channel IN ('meta', 'google', 'tiktok', 'ga4', 'gsc', 'google_ads'));

COMMIT;
