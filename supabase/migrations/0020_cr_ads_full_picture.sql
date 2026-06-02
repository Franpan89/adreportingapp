-- Add full_picture_url to cr_ads for higher-resolution creative images
ALTER TABLE public.cr_ads ADD COLUMN IF NOT EXISTS full_picture_url text;
