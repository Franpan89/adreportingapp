-- Add logo URL columns to cr_reports
ALTER TABLE public.cr_reports
  ADD COLUMN IF NOT EXISTS client_logo_url text,
  ADD COLUMN IF NOT EXISTS agency_logo_url text;
