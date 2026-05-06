-- ============================================================
-- Supabase Storage bucket for logos + agency settings table
-- ============================================================

-- Public bucket for agency and client logos (max 2 MB, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos', 'logos', true, 2097152,
  '{image/png,image/jpeg,image/webp,image/svg+xml}'
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "logos_authenticated_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "logos_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "logos_authenticated_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'logos');

CREATE POLICY "logos_authenticated_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'logos');

-- Agency-level settings (one row per admin user)
CREATE TABLE public.cr_agency_settings (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url       text,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (admin_user_id)
);

ALTER TABLE public.cr_agency_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY cr_agency_settings_own ON public.cr_agency_settings
  FOR ALL TO authenticated
  USING (admin_user_id = auth.uid())
  WITH CHECK (admin_user_id = auth.uid());
