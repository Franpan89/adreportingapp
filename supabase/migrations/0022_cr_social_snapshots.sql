-- Daily follower-count snapshots for connected Meta pages + Instagram accounts.
-- Meta deprecated the page_fans Insights metric in late 2024 and gating
-- instagram_manage_insights is hard, so we cannot rely on Meta for historical
-- follower data. We capture our own daily snapshots from the live followers_count
-- field and compute growth from this table.

CREATE TABLE IF NOT EXISTS public.cr_social_snapshots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES public.cr_clients(id) ON DELETE CASCADE,
  platform     text NOT NULL CHECK (platform IN ('facebook','instagram')),
  page_id      text NOT NULL,
  page_name    text,
  followers    integer NOT NULL,
  captured_on  date NOT NULL DEFAULT CURRENT_DATE,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (client_id, platform, page_id, captured_on)
);

CREATE INDEX IF NOT EXISTS idx_cr_social_snapshots_lookup
  ON public.cr_social_snapshots (client_id, platform, captured_on);
