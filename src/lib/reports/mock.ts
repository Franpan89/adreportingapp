import { format, addDays } from 'date-fns';
import type { PeriodReport, CampaignSummary, DailyDataPoint, MetricTotals, ReportResponse, Channel } from '@/types';
import { DEFAULT_METRIC_CONFIG } from '@/lib/metrics/definitions';

/* Deterministic pseudo-random based on seed */
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function generateDailyData(
  startDate: Date,
  days: number,
  baselines: Partial<MetricTotals>,
  seed = 42
): DailyDataPoint[] {
  return Array.from({ length: days }, (_, i) => {
    const r = (key: string, base: number) => {
      const variation = (seededRandom(seed + i * 17 + key.charCodeAt(0)) - 0.45) * 0.3;
      return Math.max(0, base * (1 + variation));
    };

    const impressions = Math.round(r('imp', baselines.impressions ?? 12000));
    const clicks = Math.round(r('clk', baselines.clicks ?? 480));
    const spend = r('spd', baselines.spend ?? 420);
    const conversions = Math.round(r('cnv', baselines.conversions ?? 28));
    const conversions_value = r('rev', baselines.conversions_value ?? 1680);

    return {
      date: format(addDays(startDate, i), 'yyyy-MM-dd'),
      dayIndex: i + 1,
      impressions,
      clicks,
      spend,
      conversions,
      conversions_value,
      ctr: clicks / impressions * 100,
      cpc: spend / clicks,
      cpm: spend / impressions * 1000,
      roas: conversions_value / spend,
      cvr: conversions / clicks * 100,
      cpa: spend / conversions,
    };
  });
}

function sumDailyData(days: DailyDataPoint[]): MetricTotals {
  const totals: MetricTotals = {
    impressions: 0, clicks: 0, spend: 0, conversions: 0, conversions_value: 0,
    reach: 0, video_views: 0, ctr: 0, cpc: 0, cpm: 0, roas: 0, cvr: 0, cpa: 0,
  };
  days.forEach(d => {
    totals.impressions += d.impressions ?? 0;
    totals.clicks += d.clicks ?? 0;
    totals.spend += d.spend ?? 0;
    totals.conversions += d.conversions ?? 0;
    totals.conversions_value += d.conversions_value ?? 0;
  });
  totals.ctr = totals.clicks / totals.impressions * 100;
  totals.cpc = totals.spend / totals.clicks;
  totals.cpm = totals.spend / totals.impressions * 1000;
  totals.roas = totals.conversions_value / totals.spend;
  totals.cvr = totals.conversions / totals.clicks * 100;
  totals.cpa = totals.spend / totals.conversions;
  return totals;
}

export const MOCK_CAMPAIGNS: CampaignSummary[] = [
  { id: '1', name: 'Brand Awareness Q2', channel: 'meta',   status: 'ACTIVE',  external_id: 'fb_001', spend: 4820, impressions: 312000, clicks: 8420,  conversions: 187, conversions_value: 11200, roas: 2.32, ctr: 2.70, cpc: 0.57, cpm: 15.45, cpa: 25.77, cvr: 2.22 },
  { id: '2', name: 'Retargeting — Cart',  channel: 'meta',   status: 'ACTIVE',  external_id: 'fb_002', spend: 2310, impressions: 89000,  clicks: 4210,  conversions: 312, conversions_value: 18720, roas: 8.10, ctr: 4.73, cpc: 0.55, cpm: 25.96, cpa: 7.40,  cvr: 7.41 },
  { id: '3', name: 'Performance Max',     channel: 'google_ads', status: 'ACTIVE',  external_id: 'ga_001', spend: 5640, impressions: 228000, clicks: 12800, conversions: 445, conversions_value: 26700, roas: 4.73, ctr: 5.61, cpc: 0.44, cpm: 24.74, cpa: 12.67, cvr: 3.48 },
  { id: '4', name: 'Search — Brand',      channel: 'google_ads', status: 'ACTIVE',  external_id: 'ga_002', spend: 1890, impressions: 48000,  clicks: 9200,  conversions: 290, conversions_value: 17400, roas: 9.21, ctr: 19.17, cpc: 0.21, cpm: 39.38, cpa: 6.52, cvr: 3.15 },
  { id: '5', name: 'TopFeed Creative 1',  channel: 'tiktok', status: 'ACTIVE',  external_id: 'tt_001', spend: 3120, impressions: 480000, clicks: 9600,  conversions: 198, conversions_value: 11880, roas: 3.81, ctr: 2.00, cpc: 0.33, cpm: 6.50,  cpa: 15.76, cvr: 2.06 },
  { id: '6', name: 'Spark Ads — UGC',    channel: 'tiktok', status: 'PAUSED',  external_id: 'tt_002', spend: 980,  impressions: 210000, clicks: 3780,  conversions: 72,  conversions_value: 4320,  roas: 4.41, ctr: 1.80, cpc: 0.26, cpm: 4.67,  cpa: 13.61, cvr: 1.90 },
  { id: '7', name: 'Lookalike — 3%',     channel: 'meta',   status: 'ACTIVE',  external_id: 'fb_003', spend: 3480, impressions: 198000, clicks: 6720,  conversions: 201, conversions_value: 12060, roas: 3.47, ctr: 3.39, cpc: 0.52, cpm: 17.58, cpa: 17.31, cvr: 2.99 },
  { id: '8', name: 'Display Remarketing', channel: 'google_ads', status: 'ACTIVE',  external_id: 'ga_003', spend: 720,  impressions: 320000, clicks: 2240,  conversions: 48,  conversions_value: 2880,  roas: 4.00, ctr: 0.70, cpc: 0.32, cpm: 2.25,  cpa: 15.00, cvr: 2.14 },
];

export function generateMockReport(
  startDate: Date,
  days: number,
  compareStartDate?: Date,
  channel?: string,
  seed = 42
): ReportResponse {
  const baselines: Partial<MetricTotals> = {
    impressions: 48000, clicks: 1920, spend: 1680, conversions: 112, conversions_value: 6720,
  };

  const primaryDays = generateDailyData(startDate, days, baselines, seed);
  const primaryTotals = sumDailyData(primaryDays);

  let filteredCampaigns = MOCK_CAMPAIGNS;
  if (channel && channel !== 'all') {
    filteredCampaigns = MOCK_CAMPAIGNS.filter(c => c.channel === channel);
  }

  const primary: PeriodReport = {
    totals: primaryTotals,
    byDate: primaryDays,
    byCampaign: filteredCampaigns,
  };

  let comparison: PeriodReport | null = null;
  let deltas: ReportResponse['deltas'] = null;

  if (compareStartDate) {
    const compDays = generateDailyData(compareStartDate, days, {
      ...baselines,
      impressions: 42000, clicks: 1680, spend: 1540, conversions: 98, conversions_value: 5880,
    }, seed + 100);
    const compTotals = sumDailyData(compDays);

    comparison = {
      totals: compTotals,
      byDate: compDays,
      byCampaign: filteredCampaigns.map(c => ({
        ...c,
        spend: c.spend! * 0.92,
        conversions: Math.round(c.conversions! * 0.88),
        conversions_value: c.conversions_value! * 0.88,
        roas: c.roas! * 0.96,
      })),
    };

    deltas = {};
    const keys = ['spend','impressions','clicks','conversions','conversions_value','roas','ctr','cpc','cpm','cpa','cvr'] as const;
    keys.forEach(k => {
      const a = primaryTotals[k] ?? 0;
      const b = compTotals[k] ?? 0;
      const pct = b === 0 ? 0 : ((a - b) / Math.abs(b)) * 100;
      deltas![k] = {
        absolute: a - b,
        percent: pct,
        direction: Math.abs(pct) < 0.5 ? 'flat' : pct > 0 ? 'up' : 'down',
      };
    });
  }

  return {
    primary,
    comparison,
    deltas,
    allowedMetrics: DEFAULT_METRIC_CONFIG,
    syncStatus: { meta: 'success', google_ads: 'success', tiktok: 'success' },
  };
}

export const MOCK_CLIENTS: Array<{
  id: string; name: string; slug: string; logo_url: null; timezone: string;
  is_active: boolean; created_at: string;
  channels: Channel[];
  sync_status: Partial<Record<Channel, 'idle' | 'syncing' | 'success' | 'error'>>;
}> = [
  {
    id: 'client-1', name: 'Luxe Cosmetics', slug: 'luxe-cosmetics', logo_url: null,
    timezone: 'America/New_York', is_active: true, created_at: '2024-01-15T00:00:00Z',
    channels: ['meta', 'google_ads', 'tiktok'],
    sync_status: { meta: 'success', google_ads: 'success', tiktok: 'success' },
  },
  {
    id: 'client-2', name: 'FitGear Pro', slug: 'fitgear-pro', logo_url: null,
    timezone: 'America/Chicago', is_active: true, created_at: '2024-02-20T00:00:00Z',
    channels: ['meta', 'google_ads'],
    sync_status: { meta: 'success', google_ads: 'error' },
  },
  {
    id: 'client-3', name: 'Urban Threads', slug: 'urban-threads', logo_url: null,
    timezone: 'America/Los_Angeles', is_active: true, created_at: '2024-03-10T00:00:00Z',
    channels: ['meta', 'tiktok'],
    sync_status: { meta: 'syncing', tiktok: 'success' },
  },
  {
    id: 'client-4', name: 'TechStart Inc.', slug: 'techstart-inc', logo_url: null,
    timezone: 'America/New_York', is_active: false, created_at: '2024-01-05T00:00:00Z',
    channels: ['google_ads'],
    sync_status: { google_ads: 'success' },
  },
];
