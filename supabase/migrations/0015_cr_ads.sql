-- =====================================================
-- wmm-client-reporting — cr_ads + cr_ad_daily_stats
-- =====================================================
-- Ad-level catalog and daily stats for Creative Ads Breakdown.
-- Per-ad thumbnails live in cr_ads; daily metrics in cr_ad_daily_stats.

BEGIN;

CREATE TABLE public.cr_ads (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid        NOT NULL REFERENCES public.cr_clients(id) ON DELETE CASCADE,
  campaign_id   uuid        NOT NULL REFERENCES public.cr_campaigns(id) ON DELETE CASCADE,
  channel       text        NOT NULL,
  external_id   text        NOT NULL,
  name          text        NOT NULL,
  thumbnail_url text,
  creative_type text,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, channel, external_id)
);

CREATE INDEX idx_cr_ads_client_channel ON public.cr_ads (client_id, channel);
CREATE INDEX idx_cr_ads_campaign       ON public.cr_ads (campaign_id);

ALTER TABLE public.cr_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY cr_ads_admin_all ON public.cr_ads
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY cr_ads_client_read ON public.cr_ads
  FOR SELECT USING (public.can_access_client(client_id));


CREATE TABLE public.cr_ad_daily_stats (
  ad_id        uuid        NOT NULL REFERENCES public.cr_ads(id) ON DELETE CASCADE,
  client_id    uuid        NOT NULL REFERENCES public.cr_clients(id) ON DELETE CASCADE,
  date         date        NOT NULL,
  impressions  bigint,
  reach        bigint,
  clicks       bigint,
  spend        numeric(14,4),
  video_views  bigint,
  conversions  numeric(14,4),
  PRIMARY KEY (ad_id, date)
);

CREATE INDEX idx_cr_ad_daily_stats_client_date ON public.cr_ad_daily_stats (client_id, date DESC);

ALTER TABLE public.cr_ad_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY cr_ad_daily_stats_admin_all ON public.cr_ad_daily_stats
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY cr_ad_daily_stats_client_read ON public.cr_ad_daily_stats
  FOR SELECT USING (public.can_access_client(client_id));

COMMIT;
