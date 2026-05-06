-- 0019: period KPIs, agency branding stored on reports + agency settings
ALTER TABLE public.cr_reports
  ADD COLUMN IF NOT EXISTS period_totals jsonb,
  ADD COLUMN IF NOT EXISTS agency_name   text,
  ADD COLUMN IF NOT EXISTS accent_color  text DEFAULT '#00BD7D';

ALTER TABLE public.cr_agency_settings
  ADD COLUMN IF NOT EXISTS agency_name   text,
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#00BD7D';
