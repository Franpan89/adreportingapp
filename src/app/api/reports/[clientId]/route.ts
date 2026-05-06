import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseDateParam } from '@/lib/utils/date';
import { DEFAULT_METRIC_CONFIG } from '@/lib/metrics/definitions';
import type { ReportResponse, PeriodReport, MetricTotals, CampaignSummary, DailyDataPoint } from '@/types';

const EMPTY_TOTALS: MetricTotals = {
  impressions: 0, clicks: 0, spend: 0, conversions: 0, conversions_value: 0,
  reach: 0, video_views: 0, ctr: 0, cpc: 0, cpm: 0, roas: 0, cvr: 0, cpa: 0,
};

function derived(t: Partial<MetricTotals>): MetricTotals {
  const imp = t.impressions ?? 0;
  const clk = t.clicks ?? 0;
  const spd = t.spend ?? 0;
  const cnv = t.conversions ?? 0;
  const rev = t.conversions_value ?? 0;
  return {
    ...EMPTY_TOTALS, ...t,
    ctr: imp > 0 ? clk / imp * 100 : 0,
    cpc: clk > 0 ? spd / clk : 0,
    cpm: imp > 0 ? spd / imp * 1000 : 0,
    roas: spd > 0 ? rev / spd : 0,
    cvr: clk > 0 ? cnv / clk * 100 : 0,
    cpa: cnv > 0 ? spd / cnv : 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPeriod(rows: any[]): PeriodReport {
  const dateMap = new Map<string, Partial<MetricTotals>>();
  const campMap = new Map<string, { info: any; t: Partial<MetricTotals> }>();
  const totals: Partial<MetricTotals> = {};

  for (const row of rows) {
    const add = (acc: Partial<MetricTotals>) => {
      acc.impressions = (acc.impressions ?? 0) + (row.impressions ?? 0);
      acc.clicks = (acc.clicks ?? 0) + (row.clicks ?? 0);
      acc.spend = (acc.spend ?? 0) + Number(row.spend ?? 0);
      acc.conversions = (acc.conversions ?? 0) + Number(row.conversions ?? 0);
      acc.conversions_value = (acc.conversions_value ?? 0) + Number(row.conversions_value ?? 0);
      acc.reach = (acc.reach ?? 0) + (row.reach ?? 0);
      acc.video_views = (acc.video_views ?? 0) + (row.video_views ?? 0);
      acc.link_clicks = (acc.link_clicks ?? 0) + (row.link_clicks ?? 0);
    };

    const d = dateMap.get(row.date) ?? {};
    add(d); dateMap.set(row.date, d);

    const id = row.campaign_id;
    const camp = campMap.get(id) ?? { info: row.cr_campaigns, t: {} };
    add(camp.t); campMap.set(id, camp);

    add(totals);
  }

  const byDate: DailyDataPoint[] = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, t]) => ({ date, ...derived(t) }));

  const byCampaign: CampaignSummary[] = Array.from(campMap.values())
    .map(({ info, t }) => ({
      id: info?.id ?? '',
      name: info?.name ?? 'Sin nombre',
      channel: info?.channel ?? 'meta',
      status: info?.status ?? 'ACTIVE',
      external_id: info?.external_id ?? '',
      objective: info?.objective ?? null,
      ...derived(t),
    }))
    .sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0));

  return { totals: derived(totals), byDate, byCampaign };
}

async function fetchStats(
  clientId: string,
  start: string,
  end: string,
  channel?: string,
) {
  const supabase = await createClient();
  let query = supabase
    .from('cr_daily_stats')
    .select('date, channel, impressions, clicks, spend, conversions, conversions_value, reach, video_views, link_clicks, campaign_id, cr_campaigns(id, name, status, external_id, channel, objective)')
    .eq('client_id', clientId)
    .gte('date', start)
    .lte('date', end);

  if (channel && channel !== 'all') query = query.eq('channel', channel);

  const { data, error } = await query;
  if (error) console.error('[reports] fetchStats error:', error.message);
  return data ?? [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;
  const { searchParams } = new URL(request.url);

  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const compareStart = searchParams.get('compare_start');
  const channel = searchParams.get('channel') ?? undefined;

  if (!start || !end) {
    return NextResponse.json({ error: 'start y end son requeridos' }, { status: 400 });
  }

  const endDate = parseDateParam(end);
  const days = Math.round((endDate.getTime() - parseDateParam(start).getTime()) / 86400000) + 1;

  // Comparison period end = compareStart + same number of days
  const compareEnd = compareStart
    ? new Date(parseDateParam(compareStart).getTime() + (days - 1) * 86400000)
        .toISOString().slice(0, 10)
    : null;

  const [primaryRows, compareRows, credRows] = await Promise.all([
    fetchStats(clientId, start, end, channel),
    compareStart && compareEnd ? fetchStats(clientId, compareStart, compareEnd, channel) : Promise.resolve([]),
    (async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from('cr_channel_credentials')
        .select('channel, sync_status')
        .eq('client_id', clientId)
        .eq('is_active', true);
      return data ?? [];
    })(),
  ]);

  const primary = buildPeriod(primaryRows);
  const comparison = compareRows.length > 0 ? buildPeriod(compareRows) : null;

  let deltas: ReportResponse['deltas'] = null;
  if (comparison) {
    deltas = {};
    const keys = ['spend','impressions','clicks','conversions','conversions_value','roas','ctr','cpc','cpm','cpa','cvr'] as const;
    keys.forEach(k => {
      const a = primary.totals[k] ?? 0;
      const b = comparison.totals[k] ?? 0;
      const pct = b === 0 ? 0 : ((a - b) / Math.abs(b)) * 100;
      deltas![k] = { absolute: a - b, percent: pct, direction: Math.abs(pct) < 0.5 ? 'flat' : pct > 0 ? 'up' : 'down' };
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const syncStatus: any = {};
  credRows.forEach((c: any) => { syncStatus[c.channel] = c.sync_status ?? 'idle'; });

  const response: ReportResponse = {
    primary,
    comparison,
    deltas,
    allowedMetrics: DEFAULT_METRIC_CONFIG,
    syncStatus,
  };

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  });
}
