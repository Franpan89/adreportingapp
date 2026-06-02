'use client';
import { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { TimeRangeSelector } from './TimeRangeSelector';
import { SourceSidebar, type ActiveTab } from './SourceSidebar';
import { ConsolidatedHome } from './ConsolidatedHome';
import { SourceTab } from './SourceTab';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { getPresetRange, getPreviousPeriod, formatDateParam } from '@/lib/utils/date';
import type { PresetKey } from '@/lib/utils/date';
import type { BusinessType, ReportResponse, SourceKey } from '@/types';
import { sortSourcesForBusinessType } from '@/lib/metrics/business-kpis';

interface DashboardShellProps {
  clientId: string;
  clientName?: string;
  /** Sources the client has connected — drives the sidebar entries. */
  availableChannels: SourceKey[];
  /** Drives KPI defaults on the consolidated home + source ordering in the sidebar. */
  businessType: BusinessType | null;
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
  businessType,
  isAdmin = false,
}: DashboardShellProps) {
  const [active, setActive] = useState<ActiveTab>('consolidated');
  const [preset, setPreset] = useState<PresetKey>('30d');
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [report, setReport] = useState<ReportResponse>(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const primaryRange = getPresetRange(preset);
  const compareRange = getPreviousPeriod(primaryRange);

  // Sidebar order: consolidated first, then sources in business-type priority.
  const orderedSources = useMemo(
    () => sortSourcesForBusinessType(availableChannels, businessType),
    [availableChannels, businessType],
  );

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);

    const params = new URLSearchParams({
      start: formatDateParam(primaryRange.start),
      end:   formatDateParam(primaryRange.end),
    });
    if (compareEnabled) params.set('compare_start', formatDateParam(compareRange.start));
    // For source tabs, fetch only that channel's data.
    // For consolidated, fetch everything.
    if (active !== 'consolidated') params.set('channel', active);

    fetch(`/api/reports/${clientId}?${params}`)
      .then(r => r.json())
      .then(data => setReport(data))
      .catch(() => setReport(EMPTY_REPORT))
      .finally(() => setLoading(false));
  }, [clientId, preset, compareEnabled, active, refreshTick]);

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    // Sync the active source on a per-source tab; sync everything on consolidated.
    const channels: SourceKey[] = active === 'consolidated' ? orderedSources : [active as SourceKey];
    const results = await Promise.all(
      channels.map(ch =>
        fetch(`/api/sync/${ch}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId }),
        }).then(r => r.json()).catch(e => ({ ok: false, error: String(e) })),
      ),
    );
    const failed = results.find(r => !r.ok);
    if (failed) setSyncError(failed.error ?? failed.message ?? 'Error al sincronizar');
    setSyncing(false);
    setRefreshTick(t => t + 1);
  }

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      <SourceSidebar
        active={active}
        onSelect={setActive}
        available={orderedSources}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-lg font-bold text-[#111827] font-[Roboto] tracking-wide">{clientName}</h1>
              <p className="text-xs text-[#9CA3AF]">
                {active === 'consolidated' ? 'Vista consolidada' : 'Vista de fuente'}
              </p>
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
                  onClick={handleSync}
                  icon={<RefreshCw className={cn('w-3.5 h-3.5', (loading || syncing) && 'animate-spin')} />}
                >
                  {syncing ? 'Sincronizando…' : loading ? 'Cargando…' : 'Sincronizar'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {syncError && (
          <div className="mx-6 mt-4 flex items-start gap-2 px-4 py-3 bg-[#fee2e2] text-[#DC2626] text-sm rounded-xl">
            <span className="font-medium">Error al sincronizar:</span> {syncError}
          </div>
        )}

        {active === 'consolidated' ? (
          <ConsolidatedHome
            report={report}
            businessType={businessType}
            availableSources={orderedSources}
            loading={loading}
            showComparison={compareEnabled}
          />
        ) : (
          <SourceTab
            sourceKey={active}
            report={report}
            loading={loading}
            showComparison={compareEnabled}
            clientId={clientId}
            since={formatDateParam(primaryRange.start)}
            until={formatDateParam(primaryRange.end)}
          />
        )}
      </div>
    </div>
  );
}
