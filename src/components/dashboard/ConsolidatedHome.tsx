'use client';
import { useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { KpiCard } from './KpiCard';
import { LineAreaChart } from '@/components/charts/LineAreaChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatMetric, formatDelta } from '@/lib/utils/format';
import { kpiDefaultsForBusinessType, sortSourcesForBusinessType, type KpiDefault } from '@/lib/metrics/business-kpis';
import type { BusinessType, ReportResponse, SourceKey } from '@/types';

const SOURCE_COLORS: Record<SourceKey, string> = {
  meta_ads:              '#1877F2',
  google_ads:            '#EA4335',
  tiktok_ads:            '#010101',
  meta_page:             '#1877F2',
  meta_instagram:        '#C13584',
  linkedin:              '#0A66C2',
  pinterest:             '#E60023',
  tiktok_organic:        '#010101',
  youtube:               '#FF0000',
  ga4:                   '#F9AB00',
  google_search_console: '#4285F4',
  shopify:               '#95BF47',
  ghl:                   '#312E81',
  klaviyo:               '#7C3AED',
  yotpo:                 '#D97706',
  toast:                 '#FB7185',
  email_sms:             '#6B7280',
};

const SOURCE_LABELS: Record<SourceKey, string> = {
  meta_ads:              'Meta Ads',
  google_ads:            'Google Ads',
  tiktok_ads:            'TikTok Ads',
  meta_page:             'Facebook',
  meta_instagram:        'Instagram',
  linkedin:              'LinkedIn',
  pinterest:             'Pinterest',
  tiktok_organic:        'TikTok',
  youtube:               'YouTube',
  ga4:                   'GA4',
  google_search_console: 'Search Console',
  shopify:               'Shopify',
  ghl:                   'GHL',
  klaviyo:               'Klaviyo',
  yotpo:                 'Yotpo',
  toast:                 'Toast',
  email_sms:             'Email/SMS',
};

interface ConsolidatedHomeProps {
  report: ReportResponse;
  businessType: BusinessType | null;
  availableSources: SourceKey[];
  loading: boolean;
  showComparison: boolean;
}

interface SourceRollup {
  source: SourceKey;
  cost: number;
  visits: number;
  conversions: number;
  revenue: number;
  roas: number | null;
  cpa: number | null;
}

const NEGATIVE_KEYS = new Set(['cost', 'blended_cpa', 'cpc', 'cpm', 'cpa']);

/** Read a KPI value from period totals. Falls back to derived values
 *  for blended_roas / blended_cpa / cost since those names don't exist
 *  in the existing paid-shaped totals. */
function readKpi(totals: ReportResponse['primary']['totals'], def: KpiDefault): number {
  if (def.key === 'cost')          return totals.spend ?? 0;
  if (def.key === 'revenue')       return totals.conversions_value ?? 0;
  if (def.key === 'visits')        return totals.clicks ?? 0;            // until cr_source_daily lands
  if (def.key === 'blended_roas')  return totals.roas ?? 0;
  if (def.key === 'blended_cpa')   return totals.cpa ?? 0;
  return totals[def.key] ?? 0;
}

function readDelta(deltas: ReportResponse['deltas'], def: KpiDefault) {
  if (!deltas) return undefined;
  const map: Record<string, string> = {
    cost: 'spend',
    revenue: 'conversions_value',
    visits: 'clicks',
    blended_roas: 'roas',
    blended_cpa: 'cpa',
  };
  const k = map[def.key] ?? def.key;
  return deltas[k];
}

function readCompare(totals: ReportResponse['primary']['totals'] | undefined, def: KpiDefault): number | undefined {
  if (!totals) return undefined;
  const map: Record<string, string> = {
    cost: 'spend',
    revenue: 'conversions_value',
    visits: 'clicks',
    blended_roas: 'roas',
    blended_cpa: 'cpa',
  };
  const k = map[def.key] ?? def.key;
  return totals[k];
}

export function ConsolidatedHome({
  report,
  businessType,
  availableSources,
  loading,
  showComparison,
}: ConsolidatedHomeProps) {
  const kpis = kpiDefaultsForBusinessType(businessType);

  // Source contribution: sum spend + revenue + conversions per channel
  // from the campaign-level rows we already have.
  const sourceRollups: SourceRollup[] = useMemo(() => {
    const acc = new Map<SourceKey, SourceRollup>();
    for (const c of report.primary.byCampaign) {
      const src = c.channel as SourceKey;
      const row = acc.get(src) ?? {
        source: src, cost: 0, visits: 0, conversions: 0, revenue: 0, roas: null, cpa: null,
      };
      row.cost        += c.spend ?? 0;
      row.visits      += c.clicks ?? 0;
      row.conversions += c.conversions ?? 0;
      row.revenue     += c.conversions_value ?? 0;
      acc.set(src, row);
    }
    for (const row of acc.values()) {
      row.roas = row.cost > 0 ? row.revenue / row.cost : null;
      row.cpa  = row.conversions > 0 ? row.cost / row.conversions : null;
    }
    return sortSourcesForBusinessType(
      Array.from(acc.values()).map(r => r.source),
      businessType,
    ).map(s => acc.get(s)!).filter(Boolean);
  }, [report, businessType]);

  // Donut: revenue contribution if we have it; otherwise spend contribution.
  const totalRevenue = sourceRollups.reduce((s, r) => s + r.revenue, 0);
  const donutBy = totalRevenue > 0 ? 'revenue' : 'cost';
  const donutData = sourceRollups
    .filter(r => r[donutBy] > 0)
    .map(r => ({
      name:  SOURCE_LABELS[r.source] ?? r.source,
      value: r[donutBy],
      color: SOURCE_COLORS[r.source] ?? '#9CA3AF',
    }));

  const hasData = report.primary.byCampaign.length > 0;

  return (
    <div className="px-6 py-5 space-y-5">
      {/* KPI band — business-type aware */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-[#F3F4F6] rounded-xl animate-pulse" />
            ))
          : kpis.map(def => (
              <KpiCard
                key={def.key}
                label={def.label}
                value={readKpi(report.primary.totals, def)}
                unit={def.unit}
                compareValue={readCompare(report.comparison?.totals, def)}
                delta={readDelta(report.deltas, def)}
                showComparison={showComparison}
                positiveIsGood={!NEGATIVE_KEYS.has(def.key)}
              />
            ))}
      </div>

      {!loading && !hasData && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl py-16 text-center">
          <p className="text-[#374151] font-semibold">Sin datos consolidados aún</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Sincroniza al menos una fuente para ver las métricas blended.
          </p>
        </div>
      )}

      {!loading && hasData && (
        <>
          {/* Trend chart + source contribution donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card depth="flat" padding={false} className="lg:col-span-2 p-5">
              <CardHeader>
                <CardTitle>Rendimiento Blended</CardTitle>
                <p className="text-xs text-[#9CA3AF]">Tendencia diaria total</p>
              </CardHeader>
              <LineAreaChart
                data={report.primary.byDate}
                metric="spend"
                unit="currency"
                height={240}
              />
            </Card>

            <Card depth="flat" padding={false} className="p-5">
              <CardHeader>
                <CardTitle>Contribución por Fuente</CardTitle>
                <p className="text-xs text-[#9CA3AF]">{donutBy === 'revenue' ? 'Por ingresos' : 'Por inversión'}</p>
              </CardHeader>
              <DonutChart data={donutData} height={200} />
            </Card>
          </div>

          {/* Source leaderboard */}
          <Card depth="flat" padding={false} className="p-5">
            <CardHeader>
              <CardTitle>Tabla de Fuentes</CardTitle>
              <p className="text-xs text-[#9CA3AF]">{sourceRollups.length} fuentes con datos</p>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-left text-[11px] uppercase tracking-wider text-[#6B7280]">
                    <th className="px-3 py-2 font-medium">Fuente</th>
                    <th className="px-3 py-2 font-medium text-right">Inversión</th>
                    <th className="px-3 py-2 font-medium text-right">Visitas</th>
                    <th className="px-3 py-2 font-medium text-right">Conversiones</th>
                    <th className="px-3 py-2 font-medium text-right">Ingresos</th>
                    <th className="px-3 py-2 font-medium text-right">ROAS</th>
                    <th className="px-3 py-2 font-medium text-right">CPA</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceRollups.map(r => (
                    <tr key={r.source} className="border-b border-[#F3F4F6] last:border-0">
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: SOURCE_COLORS[r.source] }}
                          />
                          <span className="font-medium text-[#111827]">
                            {SOURCE_LABELS[r.source] ?? r.source}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#111827]">{formatMetric(r.cost,        'currency')}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#111827]">{formatMetric(r.visits,      'integer')}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#111827]">{formatMetric(r.conversions, 'integer')}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#111827]">{formatMetric(r.revenue,     'currency')}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#111827]">{r.roas != null ? formatMetric(r.roas, 'ratio') : '—'}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#111827]">{r.cpa  != null ? formatMetric(r.cpa,  'currency') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {availableSources.length > sourceRollups.length && (
            <p className="text-xs text-[#9CA3AF]">
              {availableSources.length - sourceRollups.length} fuente(s) conectada(s) sin datos en este período.
            </p>
          )}
        </>
      )}

      {/* avoid unused-var warning when delta/compare formatters aren't pulled in */}
      <span className="hidden">{formatDelta(0)}</span>
    </div>
  );
}
