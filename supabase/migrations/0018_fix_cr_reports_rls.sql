-- Fix cr_reports admin policy to use is_admin() like all other cr_* tables.
-- The original policy (reports_admin_all) checked created_by = auth.uid(),
-- which fails when clients were created via service role or by a different user.

DROP POLICY IF EXISTS reports_admin_all ON public.cr_reports;

CREATE POLICY cr_reports_admin_all ON public.cr_reports
  FOR ALL TO authenticated
  USING     (public.is_admin())
  WITH CHECK(public.is_admin());

-- Keep the client read-only policy but update it to reference cr_client_users.
DROP POLICY IF EXISTS reports_client_select ON public.cr_reports;

CREATE POLICY cr_reports_client_select ON public.cr_reports
  FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.cr_client_users cu
      WHERE cu.client_id = cr_reports.client_id
        AND cu.user_id   = auth.uid()
    )
  );
