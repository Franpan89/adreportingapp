/* =====================================================
   Core domain types for the Ad Reporting App
   ===================================================== */

/**
 * SourceKey — every traffic source the app can render.
 *
 * Phase 2 introduces this as the canonical naming scheme. Migration 0013
 * brings the database in line: cr_channel_credentials, cr_campaigns,
 * cr_daily_stats, and cr_source_daily all CHECK against this set.
 *
 * `Channel` is kept as an alias for backwards-compatible imports across
 * the app. New code should reach for `SourceKey`.
 */
export type SourceKey =
  // Paid ads
  | 'meta_ads'
  | 'google_ads'
  | 'tiktok_ads'
  // Organic social
  | 'meta_page'        // Facebook organic
  | 'meta_instagram'   // Instagram organic
  | 'linkedin'
  | 'pinterest'
  | 'tiktok_organic'   // distinct from tiktok_ads
  | 'youtube'
  // Web / search
  | 'ga4'
  | 'google_search_console'
  // Commerce / CRM / engagement
  | 'shopify'
  | 'ghl'
  | 'klaviyo'
  | 'yotpo'
  | 'toast'
  | 'email_sms';

export type Channel = SourceKey;

/** Five buckets used as a SHORTCUT for KPI defaults on the consolidated home.
 *  Never a feature gate. The connected-sources rule and the per-client
 *  metric-config UI both override this. Nullable in the DB until classified. */
export type BusinessType =
  | 'ecommerce'
  | 'high_ticket_local'
  | 'low_ticket_local'
  | 'b2b'
  | 'restaurant';

export type UserRole = 'admin' | 'client' | 'super_admin';

/* ----- SaaS / Licencias ----- */
export type PlanId = 'starter' | 'pro' | 'enterprise';
export type LicenseStatus = 'active' | 'suspended' | 'expired' | 'trial';

export interface Plan {
  id: PlanId;
  name: string;
  price_monthly: number;
  max_clients: number | null; // null = ilimitado
  max_channels: number;
  features: string[];
  color: string;
}

export interface LicenseAddons {
  story_engine?: boolean;
}

export interface License {
  id: string;
  agency_id: string;
  agency_name: string;
  agency_email: string;
  plan_id: PlanId;
  status: LicenseStatus;
  created_at: string;
  expires_at: string | null;
  activated_at: string | null;
  notes: string | null;
  clients_count: number;
  temp_password: string | null;
  addons: LicenseAddons;
}

/* ----- Auth ----- */
export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
}

/* ----- Client ----- */
export interface Client {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
  /** Shortcut for KPI defaults on the consolidated home. Nullable until classified. */
  business_type: BusinessType | null;
  channels?: Channel[];
  sync_status?: Partial<Record<Channel, 'idle' | 'syncing' | 'success' | 'error'>>;
}

/* ----- Metric definitions ----- */
export type MetricUnit = 'currency' | 'percent' | 'integer' | 'decimal' | 'ratio';

export interface MetricDefinition {
  key: string;
  label: string;
  description?: string;
  unit: MetricUnit;
  channels: Channel[];
  is_derived: boolean;
  formula?: string;
}

export interface MetricConfig {
  metric_key: string;
  label: string;
  unit: MetricUnit;
  is_visible: boolean;
  display_order: number;
  show_in_kpi: boolean;
  show_in_table: boolean;
  show_in_chart: boolean;
}

/* ----- Credentials ----- */
export interface ChannelCredential {
  id: string;
  client_id: string;
  channel: Channel;
  is_active: boolean;
  last_synced_at: string | null;
  sync_status: 'idle' | 'syncing' | 'success' | 'error' | null;
  sync_error: string | null;
}

/* ----- Report data ----- */
export interface MetricTotals {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  conversions_value: number;
  reach: number;
  video_views: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  cvr: number;
  cpa: number;
  link_clicks?: number;
  // GA4 (organic / sessions)
  sessions?: number;
  organic_users?: number;
  // GSC (organic search)
  organic_clicks?: number;
  organic_impressions?: number;
  organic_position?: number;
  organic_ctr?: number;
  [key: string]: number | undefined;
}

export interface DailyDataPoint {
  date: string;
  dayIndex?: number;
  impressions?: number;
  clicks?: number;
  spend?: number;
  conversions?: number;
  conversions_value?: number;
  reach?: number;
  video_views?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  roas?: number;
  cvr?: number;
  cpa?: number;
}

export interface CampaignSummary {
  id: string;
  name: string;
  channel: Channel;
  status: string;
  external_id: string;
  objective?: string | null;
  impressions?: number;
  clicks?: number;
  spend?: number;
  conversions?: number;
  conversions_value?: number;
  reach?: number;
  video_views?: number;
  link_clicks?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  roas?: number;
  cvr?: number;
  cpa?: number;
}

export interface PeriodReport {
  totals: MetricTotals;
  byDate: DailyDataPoint[];
  byCampaign: CampaignSummary[];
}

export interface ReportResponse {
  primary: PeriodReport;
  comparison: PeriodReport | null;
  deltas: Record<string, { absolute: number; percent: number; direction: 'up' | 'down' | 'flat' }> | null;
  allowedMetrics: MetricConfig[];
  syncStatus: Partial<Record<Channel, 'idle' | 'syncing' | 'success' | 'error'>>;
}

/* ----- Client-facing reports (generated by admin) ----- */
export type ClientReportStatus = 'draft' | 'published';

export interface PeriodTotals {
  spend: number;
  conversions: number;
  impressions: number;
  reach: number;
  interactions: number;
}

export interface TopCreative {
  name: string;
  channel: Channel;
  spend: number;
  impressions: number;
  ctr: number;
  conversions: number;
  thumbnail_url?: string | null;
  full_picture_url?: string | null;
  campaign_name?: string | null;
  reach?: number;
  clicks?: number;
  video_views?: number;
}

export interface SpendResult {
  channel: Channel;
  spend: number;
  conversions: number;
  cpa: number;
  roas: number;
}

/** Real demographic breakdown fetched live from Meta Insights API */
export interface DemographicBreakdownRow {
  label: string;       // e.g. "Hombres", "18-24", "México", "Ciudad de México"
  impressions: number;
  reach: number;
  spend: number;
  pct: number;         // % of total reach
}

export interface DemographicData {
  gender:    DemographicBreakdownRow[];
  age:       DemographicBreakdownRow[];
  countries: DemographicBreakdownRow[];
  regions:   DemographicBreakdownRow[];
}

export interface AudienceSegment {
  name: string;
  reach: number;
  engagement_rate: number;
  notes?: string;
}

export interface SocialGrowthMetric {
  platform: 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'x';
  followers_start: number;
  followers_end: number;
  growth_pct: number;
}

export interface ClientReport {
  id: string;
  client_id: string;
  title: string;
  period_start: string;   // ISO date
  period_end: string;
  status: ClientReportStatus;
  created_at: string;
  published_at: string | null;
  created_by: string | null;

  executive_summary: string;
  top_creatives: TopCreative[];
  spend_vs_results: SpendResult[];
  audiences: AudienceSegment[];
  social_growth: SocialGrowthMetric[];
  recommendations: string;

  client_logo_url: string | null;
  agency_logo_url: string | null;
  period_totals: PeriodTotals | null;
  agency_name: string | null;
  accent_color: string | null;
}

/* ----- Source-level daily rollup (cr_source_daily) ----- */

/**
 * One row per (client, source, date). Universal attribution columns are
 * typed; per-source specifics live in `extra`. Mirror of cr_source_daily.
 *
 * Universal column semantics:
 *   cost         ad spend for paid; null/0 for organic
 *   impressions  views/reach equivalent at impression-level
 *   clicks       paid-ad clicks (Meta/Google/TikTok)
 *   visits       organic clicks/sessions/profile-visits — separate from
 *                paid clicks because they come from different platforms
 *   conversions  platform-reported outcomes (varies per source)
 *   revenue      attributed/reported revenue. Canonical: Shopify for ecom,
 *                Toast for restaurant. Never the ad-platform's own number.
 *   reach        unique people reached (when reported)
 *   engagements  likes+comments+shares for social, opens+clicks for email
 *
 * Per-source `extra` keys are the connector's contract — see each
 * connector module for the shape it writes.
 */
export interface SourceDailyRow {
  client_id: string;
  source_key: SourceKey;
  date: string;             // ISO date (YYYY-MM-DD)
  cost: number | null;
  impressions: number | null;
  clicks: number | null;
  visits: number | null;
  conversions: number | null;
  revenue: number | null;
  reach: number | null;
  engagements: number | null;
  extra: Record<string, unknown>;
  synced_at: string;        // ISO timestamp
}

/* ----- Sync ----- */
export interface SyncLog {
  id: string;
  client_id: string;
  channel: Channel;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'partial' | 'error';
  rows_upserted: number | null;
  error_detail: string | null;
}

/* ----- Agency Meta Connection ----- */
export interface AdAccount {
  id: string;          // e.g. "act_123456789"
  name: string;
  account_status: number; // 1 = ACTIVE
  currency: string;
}
