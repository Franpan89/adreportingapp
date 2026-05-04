-- =====================================================
-- wmm-client-reporting — cr_clients.business_type (Phase 2)
-- =====================================================
-- Five buckets, used as a SHORTCUT for KPI defaults on the consolidated
-- home view — never as a feature gate. The connected-sources rule and the
-- per-client metric-config UI both override this.
--
-- Nullable: existing clients get NULL until the team classifies them. The
-- consolidated home falls back to a generic KPI default when null.

BEGIN;

ALTER TABLE public.cr_clients
  ADD COLUMN business_type text NULL
  CHECK (business_type IS NULL OR business_type IN (
    'ecommerce',
    'high_ticket_local',
    'low_ticket_local',
    'b2b',
    'restaurant'
  ));

COMMENT ON COLUMN public.cr_clients.business_type IS
  'Shortcut for KPI defaults on the consolidated home. Not a feature gate. Nullable.';

COMMIT;
