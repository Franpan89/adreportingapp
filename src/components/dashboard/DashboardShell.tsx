'use client';
import { useState, useMemo } from 'react';
import { RefreshCw, LayoutGrid, Columns2 } from 'lucide-react';
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
import { generateMockReport } from '@/lib/reports/mock';
import { getPresetRange, getPreviousPeriod } from '@/lib/utils/date';
import type { PresetKey } from '@/lib/utils/date';
import type { Channel, MetricConfig } from '@/types';
import { METRIC_DEFINITIONS } from '@/lib/metrics/definitions';

const CHANNEL_COLORS = { meta: '#1877F2', google: '#EA4335', tiktok: '#010101' };

interface DashboardShellProps {
  clientId?: string;
  clientName?: string;
  availableChannels?: Channel[];
  /** When false (client view): hides admin-only controls like Sync */
  isAdmin?: boolean;
}

export function DashboardShell({
  clientName = 'Client Dashboard',
  availableChannels = ['meta', 'google', 'tiktok'],
  isAdmin = false,
}: DashboardShellProps) {
  const [activeChannel, setActiveChannel] = useState<Channel | 'all'>('all');
  const [preset, setPreset] = useState<PresetKey>('30d');
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareMode, setCompareMode] = useState<'overlay' | 'side-by-side'>('overlay');
  const [chartMetric, setChartMetric] = useState('spend');

  const primaryRange = getPresetRange(preset);
  const compareRange = getPreviousPeriod(primaryRange);
  const days = Math.round((primaryRange.end.getTime() - primaryRange.start.getTime()) / 86400000) + 1;

  const report = useMemo(() =>
    generateMockReport(
      primaryRange.start,
      days,
      compareEnabled ? compareRange.start : undefined,
      activeChannel === 'all' ? undefined : activeChannel,
    ),
    [preset, compareEnabled, activeChannel]
  );

  const kpiMetrics = report.allowedMetrics.filter(m => m.show_in_kpi && m.is_visible);
  const negativeMetrics = new Set(['cpc', 'cpm', 'cpa']);

  const donutData = (() => {
    const byChannel: Record<string, number> = {};
    report.primary.byCampaign.forEach(c => {
      byChannel[c.channel] = (byChannel[c.channel] ?? 0) + (c.spend ?? 0);
    });
    return Object.entries(byChannel).map(([ch, val]) => ({
      name: ch.charAt(0).toUpperCase() + ch.slice(1),
      value: val,
      color: CHANNEL_COLORS[ch as Channel] ?? '#9CA3AF',
    }));
  })();

  const chartMetricDef = METRIC_DEFINITIONS.find(m => m.key === chartMetric);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-[#111827] font-[Oswald] tracking-wide">
              {clientName}
            </h1>
            <p className="text-xs text-[#9CA3AF]">Campaign performance overview</p>
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
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>
                Sync
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 space-y-5">
        {/* Channel tabs */}
        <ChannelTabs
          active={activeChannel}
          onChange={setActiveChannel}
          available={availableChannels}
        />

        {/* KPI cards */}
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

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main trend chart — 2/3 width */}
          <Card depth="flat" padding={false} className="lg:col-span-2 p-5">
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
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
                  <p className="text-xs font-medium text-[#374151] mb-2">Current period</p>
                  <LineAreaChart
                    data={report.primary.byDate}
                    metric={chartMetric}
                    unit={chartMetricDef?.unit ?? 'integer'}
                    height={220}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6B7280] mb-2">Previous period</p>
                  <LineAreaChart
                    data={report.comparison?.byDate ?? []}
                    metric={chartMetric}
                    unit={chartMetricDef?.unit ?? 'integer'}
                    height={220}
                  />
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

          {/* Spend by channel donut — 1/3 */}
          <Card depth="flat" padding={false} className="p-5">
            <CardHeader>
              <CardTitle>Spend by Channel</CardTitle>
            </CardHeader>
            <DonutChart data={donutData} height={160} />
          </Card>
        </div>

        {/* Second charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card depth="flat" padding={false} className="p-5">
            <CardHeader>
              <CardTitle>Top Campaigns by Spend</CardTitle>
            </CardHeader>
            <CampaignBarChart
              campaigns={report.primary.byCampaign}
              metric="spend"
              height={220}
            />
          </Card>
          <Card depth="flat" padding={false} className="p-5">
            <CardHeader>
              <CardTitle>Top Campaigns by ROAS</CardTitle>
            </CardHeader>
            <CampaignBarChart
              campaigns={report.primary.byCampaign}
              metric="roas"
              height={220}
            />
          </Card>
        </div>

        {/* Campaign table */}
        <Card depth="flat" padding={false} className="p-5">
          <CardHeader>
            <CardTitle>Campaign Breakdown</CardTitle>
            <p className="text-xs text-[#9CA3AF]">{report.primary.byCampaign.length} active campaigns</p>
          </CardHeader>
          <CampaignTable
            campaigns={report.primary.byCampaign}
            compareCampaigns={report.comparison?.byCampaign}
            allowedMetrics={report.allowedMetrics}
            showComparison={compareEnabled}
          />
        </Card>
      </div>
    </div>
  );
}
