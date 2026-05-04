'use client';
import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, LayoutGrid, Columns2, BarChart3 } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { ChannelTabs } from './ChannelTabs';
import { TimeRangeSelector } from './TimeRangeSelector';
import { CampaignTable } from './CampaignTable';
import { LineAreaChart } from '@/components/charts/LineAreaChart';
import { CampaignBarChart } from '@/components/charts/BarChartComp';
import { DonutChart } from '@/components/charts/DonutChart';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { getPresetRange, getPreviousPeriod, formatDateParam } from '@/lib/utils/date';
import type { PresetKey } from '@/lib/utils/date';
import type { Channel, MetricConfig, ReportResponse } from '@/types';
import { METRIC_DEFINITIONS } from '@/lib/metrics/definitions';

const CHANNEL_COLORS: Record<Channel, string> = {
  meta:       '#1877F2',
  google:     '#EA4335',
  google_ads: '#EA4335',
  tiktok:     '#010101',
  ga4:        '#F9AB00',
  gsc:        '#4285F4',
  gtm:        '#34A853',
  shopify:    '#95BF47',
  ghl:        '#312E81',
};

interface DashboardShellProps {
  clientId: string;
  clientName?: string;
  availableChannels: Channel[];
  isAdmin?: boolean;
}

const EMPTY_REPORT: ReportResponse = {
  primary: { totals: { impressions:0,clicks:0,spend:0,conversions:0,conversions_value:0,reach:0,video_views:0,ctr:0,cpc:0,cpm:0,roas:0,cvr:0,cpa:0 }, byDate: [], byCampaign: [] },
  comparison: null,
  deltas: null,
  allowedMetrics: [],
  syncStatus: {},
};

export function DashboardShell({
  clientId,
  clientName = 'Dashboard',
  availableChannels,
  isAdmin = false,
}: DashboardShellProps) {
  const [activeChannel, setActiveChannel] = useState<Channel | 'all'>('all');
  const [preset, setPreset] = useState<PresetKey>('30d');
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareMode, setCompareMode] = useState<'overlay' | 'side-by-side'>('overlay');
  const [chartMetric, setChartMetric] = useState('spend');
  const [report, setReport] = useState<ReportResponse>(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const primaryRange = getPresetRange(preset);
  const compareRange = getPreviousPeriod(primaryRange);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);

    const params = new URLSearchParams({
      start: formatDateParam(primaryRange.start),
      end: formatDateParam(primaryRange.end),
    });
    if (compareEnabled) params.set('compare_start', formatDateParam(compareRange.start));
    if (activeChannel !== 'all') params.set('channel', activeChannel);

    fetch(`/api/reports/${clientId}?${params}`)
      .then(r => r.json())
      .then(data => setReport(data))
      .catch(() => setReport(EMPTY_REPORT))
      .finally(() => setLoading(false));
  }, [clientId, preset, compareEnabled, activeChannel, refreshTick]);

  const kpiMetrics = (report.allowedMetrics as MetricConfig[]).filter(m => m.show_in_kpi && m.is_visible);
  const negativeMetrics = new Set(['cpc', 'cpm', 'cpa']);
  const hasData = report.primary.byCampaign.length > 0;

  const donutData = useMemo(() => {
    const byChannel: Record<string, number> = {};
    report.primary.byCampaign.forEach(c => {
      byChannel[c.channel] = (byChannel[c.channel] ?? 0) + (c.spend ?? 0);
    });
    return Object.entries(byChannel).map(([ch, val]) => ({
      name: ch.charAt(0).toUpperCase() + ch.slice(1),
      value: val,
      color: CHANNEL_COLORS[ch as Channel] ?? '#9CA3AF',
    }));
  }, [report]);

  const chartMetricDef = METRIC_DEFINITIONS.find(m => m.key === chartMetric);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-[#111827] font-[Oswald] tracking-wide">{clientName}</h1>
            <p className="text-xs text-[#9CA3AF]">Rendimiento de campañas</p>
          </div>
          <div className="flex items-center gap-2">
            <TimeRangeSelector
              preset={preset}
              compareEnabled={compareEnabled}
              compareRange={compareRange}
              onPresetChange={setPreset}
              onCompareToggle={setCompareEnabled}
            />
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                disabled={loading || syncing}
                onClick={async () => {
                  setSyncing(true);
                  setSyncError(null);
                  const channels = activeChannel === 'all' ? availableChannels : [activeChannel as typeof availableChannels[number]];
                  const results = await Promise.all(
                    channels.map(ch =>
                      fetch(`/api/sync/${ch}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ clientId }),
                      }).then(r => r.json()).catch(e => ({ ok: false, error: String(e) }))
                    )
                  );
                  const failed = results.find(r => !r.ok);
                  if (failed) setSyncError(failed.error ?? failed.message ?? 'Error al sincronizar');
                  else {
                    const total = results.reduce((s, r) => s + (r.rows_upserted ?? 0), 0);
                    console.log(`[sync] done — ${total} rows upserted`);
                  }
                  setSyncing(false);
                  setRefreshTick(t => t + 1);
                }}
                icon={<RefreshCw className={cn('w-3.5 h-3.5', (loading || syncing) && 'animate-spin')} />}
              >
                {syncing ? 'Sincronizando…' : loading ? 'Cargando…' : 'Sincronizar'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 space-y-5">
        {syncError && (
          <div className="flex items-start gap-2 px-4 py-3 bg-[#fee2e2] text-[#DC2626] text-sm rounded-xl">
            <span className="font-medium">Error al sincronizar:</span> {syncError}
          </div>
        )}
        <ChannelTabs active={activeChannel} onChange={setActiveChannel} available={availableChannels} />

        {/* Empty state */}
        {!loading && !hasData && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-7 h-7 text-[#9CA3AF]" />
            </div>
            <p className="text-[#374151] font-semibold mb-1">Sin datos de campañas</p>
            <p className="text-sm text-[#9CA3AF] max-w-xs">
              {isAdmin
                ? 'Conecta las credenciales del cliente y sincroniza para ver métricas reales.'
                : 'Aún no hay datos disponibles. Contacta a tu agencia.'}
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-[#F3F4F6] rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Data */}
        {!loading && hasData && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {kpiMetrics.map(m => (
                <KpiCard
                  key={m.metric_key}
                  label={m.label}
                  value={report.primary.totals[m.metric_key] ?? 0}
                  unit={m.unit}
                  compareValue={report.comparison?.totals[m.metric_key]}
                  delta={report.deltas?.[m.metric_key]}
                  showComparison={compareEnabled}
                  positiveIsGood={!negativeMetrics.has(m.metric_key)}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card depth="flat" padding={false} className="lg:col-span-2 p-5">
                <CardHeader>
                  <CardTitle>Rendimiento en el Tiempo</CardTitle>
                  <div className="flex items-center gap-2">
                    {compareEnabled && (
                      <div className="flex items-center gap-1 bg-[#F3F4F6] p-0.5 rounded-lg">
                        <button
                          onClick={() => setCompareMode('overlay')}
                          className={cn('p-1.5 rounded text-[#6B7280] transition-colors', compareMode === 'overlay' && 'bg-white shadow-sm text-[#111827]')}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCompareMode('side-by-side')}
                          className={cn('p-1.5 rounded text-[#6B7280] transition-colors', compareMode === 'side-by-side' && 'bg-white shadow-sm text-[#111827]')}
                        >
                          <Columns2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <Select
                      options={METRIC_DEFINITIONS.filter(m => m.key !== 'cvr').map(m => ({ value: m.key, label: m.label }))}
                      value={chartMetric}
                      onChange={e => setChartMetric(e.target.value)}
                      className="text-xs py-1 h-auto"
                    />
                  </div>
                </CardHeader>

                {compareEnabled && compareMode === 'side-by-side' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-[#374151] mb-2">Período actual</p>
                      <LineAreaChart data={report.primary.byDate} metric={chartMetric} unit={chartMetricDef?.unit ?? 'integer'} height={220} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#6B7280] mb-2">Período anterior</p>
                      <LineAreaChart data={report.comparison?.byDate ?? []} metric={chartMetric} unit={chartMetricDef?.unit ?? 'integer'} height={220} />
                    </div>
                  </div>
                ) : (
                  <LineAreaChart
                    data={report.primary.byDate}
                    compareData={report.comparison?.byDate}
                    metric={chartMetric}
                    unit={chartMetricDef?.unit ?? 'integer'}
                    height={260}
                    showComparison={compareEnabled}
                    compareMode="overlay"
                  />
                )}
              </Card>

              <Card depth="flat" padding={false} className="p-5">
                <CardHeader><CardTitle>Inversión por Canal</CardTitle></CardHeader>
                <DonutChart data={donutData} height={160} />
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card depth="flat" padding={false} className="p-5">
                <CardHeader><CardTitle>Top Campañas por Inversión</CardTitle></CardHeader>
                <CampaignBarChart campaigns={report.primary.byCampaign} metric="spend" height={220} />
              </Card>
              <Card depth="flat" padding={false} className="p-5">
                <CardHeader><CardTitle>Top Campañas por ROAS</CardTitle></CardHeader>
                <CampaignBarChart campaigns={report.primary.byCampaign} metric="roas" height={220} />
              </Card>
            </div>

            <Card depth="flat" padding={false} className="p-5">
              <CardHeader>
                <CardTitle>Desglose de Campañas</CardTitle>
                <p className="text-xs text-[#9CA3AF]">{report.primary.byCampaign.length} campañas</p>
              </CardHeader>
              <CampaignTable
                campaigns={report.primary.byCampaign}
                compareCampaigns={report.comparison?.byCampaign}
                allowedMetrics={report.allowedMetrics as MetricConfig[]}
                showComparison={compareEnabled}
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
