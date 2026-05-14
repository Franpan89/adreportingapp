-- Add conversions column to cr_ad_daily_stats for WhatsApp/messaging campaigns
ALTER TABLE public.cr_ad_daily_stats ADD COLUMN IF NOT EXISTS conversions bigint DEFAULT 0;
