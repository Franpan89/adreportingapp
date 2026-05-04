'use client';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { KpiCard } from './KpiCard';
import { CampaignTable } from './CampaignTable';
import { LineAreaChart } from '@/components/charts/LineAreaChart';
import { CampaignBarChart } from '@/components/charts/BarChartComp';
import { Sparkles } from 'lucide-react';
import type { MetricConfig, MetricUnit, ReportResponse, SourceKey } from '@/types';

/** Per-source KPI card definition. Picks columns from the
 *  cr_daily_stats / period totals already populated for paid sources.
 *  Other sources show a "Coming soon" placeholder until their connectors
 *  ship in Phase 4. */
interface SourceKpi {
  totalsKey: string;
  label: string;
  unit: MetricUnit;
  /** Higher value is "good" — controls delta color. Default true. */
  positiveIsGood?: boolean;
}

const SOURCE_KPIS: Partial<Record<SourceKey, SourceKpi[]>> = {
  meta_ads: [
    { totalsKey: 'impressions',       label: 'Impresiones',  unit: 'integer'  },
    { totalsKey: 'reach',             label: 'Alcance',      unit: 'integer'  },
    { totalsKey: 'clicks',            label: 'Clics',        unit: 'integer'  },
    { totalsKey: 'spend',             label: 'Inversión',    unit: 'currency', positiveIsGood: false },
    { totalsKey: 'ctr',               label: 'CTR',          unit: 'percent'  },
    { totalsKey: 'cpm',               label: 'CPM',          unit: 'currency', positiveIsGood: false },
    { totalsKey: 'cpc',               label: 'CPC',          unit: 'currency', positiveIsGood: false },
    { totalsKey: 'conversions_value', label: 'Valor compra', unit: 'currency' },
    { totalsKey: 'roas',              label: 'ROAS',         unit: 'ratio'    },
    { totalsKey: 'conversions',       label: 'Compras',      unit: 'integer'  },
  ],
  google_ads: [
    { totalsKey: 'impressions',       label: 'Impresiones',  unit: 'integer'  },
    { totalsKey: 'clicks',            label: 'Clics',        unit: 'integer'  },
    { totalsKey: 'cpc',               label: 'CPC Promedio', unit: 'currency', positiveIsGood: false },
    { totalsKey: 'cpm',               label: 'CPM Promedio', unit: 'currency', positiveIsGood: false },
    { totalsKey: 'ctr',               label: 'CTR',          unit: 'percent'  },
    { totalsKey: 'conversions',       label: 'Conversiones', unit: 'integer'  },
    { totalsKey: 'conversions_value', label: 'Valor conv.',  unit: 'currency' },
    { totalsKey: 'cvr',               label: 'Tasa conv.',   unit: 'percent'  },
    { totalsKey: 'spend',             label: 'Costo',        unit: 'currency', positiveIsGood: false },
    { totalsKey: 'cpa',               label: 'Costo/conv.',  unit: 'currency', positiveIsGood: false },
    { totalsKey: 'roas',              label: 'ROAS',         unit: 'ratio'    },
  ],
  tiktok_ads: [
    { totalsKey: 'impressions',       label: 'Impresiones',  unit: 'integer'  },
    { totalsKey: 'reach',             label: 'Alcance',      unit: 'integer'  },
    { totalsKey: 'clicks',            label: 'Clics',        unit: 'integer'  },
    { totalsKey: 'spend',             label: 'Inversión',    unit: 'currency', positiveIsGood: false },
    { totalsKey: 'ctr',               label: 'CTR',          unit: 'percent'  },
    { totalsKey: 'cpm',               label: 'CPM',          unit: 'currency', positiveIsGood: false },
    { totalsKey: 'video_views',       label: 'Vistas video', unit: 'integer'  },
    { totalsKey: 'conversions',       label: 'Conversiones', unit: 'integer'  },
    { totalsKey: 'roas',              label: 'ROAS',         unit: 'ratio'    },
  ],
};

const SOURCE_LABELS: Record<SourceKey, string> = {
  meta_ads:              'Meta Ads',
  google_ads:            'Google Ads',
  tiktok_ads:            'TikTok Ads',
  meta_page:             'Facebook (organic)',
  meta_instagram:        'Instagram (organic)',
  linkedin:              'LinkedIn',
  pinterest:             'Pinterest',
  tiktok_organic:        'TikTok (organic)',
  youtube:               'YouTube',
  ga4:                   'Google Analytics',
  google_search_console: 'Search Console',
  shopify:               'Shopify',
  ghl:                   'Go High Level',
  klaviyo:               'Klaviyo',
  yotpo:                 'Yotpo',
  toast:                 'Toast POS',
  email_sms:             'Email & SMS',
};

const NEGATIVE_KEYS = new Set(['cpc', 'cpm', 'cpa', 'spend']);

interface SourceTabProps {
  sourceKey: SourceKey;
  report: ReportResponse;
  loading: boolean;
  showComparison: boolean;
}

export function SourceTab({ sourceKey, report, loading, showComparison }: SourceTabProps) {
  const kpis = SOURCE_KPIS[sourceKey];
  const label = SOURCE_LABELS[sourceKey];

  // Filter campaigns to this source. The API already filters by channel
  // when called with ?channel=, but be defensive in case the parent passes
  // an unfiltered report.
  const campaigns = report.primary.byCampaign.filter(c => c.channel === sourceKey);
  const hasData = campaigns.length > 0;

  // Sources without a KPI map = no connector yet → placeholder.
  if (!kpis) {
    return (
      <div className="px-6 py-5">
        <Card depth="flat" padding={false} className="p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-[#7C3AED]" />
          </div>
          <h2 className="text-lg font-bold text-[#111827] mb-1">{label}</h2>
          <p className="text-sm text-[#6B7280] mb-3">
            Próximamente — conecta {label} para ver sus métricas aquí.
          </p>
          <p className="text-xs text-[#9CA3AF] max-w-md mx-auto">
            Este conector está planificado en Phase 4. Mientras tanto, los datos de
            las fuentes ya conectadas siguen disponibles en sus pestañas.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 space-y-5">
      {/* KPI band — source-specific (e.g., Meta has 10, Google has 11) */}
      <div>
        <h2 className="text-base font-semibold text-[#111827] mb-3">{label}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {loading
            ? Array.from({ length: kpis.length }).map((_, i) => (
                <div key={i} className="h-24 bg-[#F3F4F6] rounded-xl animate-pulse" />
              ))
            : kpis.map(k => (
                <KpiCard
                  key={k.totalsKey}
                  label={k.label}
                  value={report.primary.totals[k.totalsKey] ?? 0}
                  unit={k.unit}
                  compareValue={report.comparison?.totals[k.totalsKey]}
                  delta={report.deltas?.[k.totalsKey]}
                  showComparison={showComparison}
                  positiveIsGood={k.positiveIsGood ?? !NEGATIVE_KEYS.has(k.totalsKey)}
                />
              ))}
        </div>
      </div>

      {!loading && !hasData && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl py-16 text-center">
          <p className="text-[#374151] font-semibold">Sin datos para {label}</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Sincroniza esta fuente o selecciona otro rango de fechas.
          </p>
        </div>
      )}

      {!loading && hasData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card depth="flat" padding={false} className="lg:col-span-2 p-5">
              <CardHeader>
                <CardTitle>Tendencia diaria</CardTitle>
                <p className="text-xs text-[#9CA3AF]">Inversión a lo largo del período</p>
              </CardHeader>
              <LineAreaChart
                data={report.primary.byDate}
                metric="spend"
                unit="currency"
                height={240}
              />
            </Card>
            <Card depth="flat" padding={false} className="p-5">
              <CardHeader><CardTitle>Top campañas por inversión</CardTitle></CardHeader>
              <CampaignBarChart campaigns={campaigns} metric="spend" height={240} />
            </Card>
          </div>

          <Card depth="flat" padding={false} className="p-5">
            <CardHeader>
              <CardTitle>Desglose de campañas</CardTitle>
              <p className="text-xs text-[#9CA3AF]">{campaigns.length} campañas</p>
            </CardHeader>
            <CampaignTable
              campaigns={campaigns}
              compareCampaigns={report.comparison?.byCampaign?.filter(c => c.channel === sourceKey)}
              allowedMetrics={report.allowedMetrics as MetricConfig[]}
              showComparison={showComparison}
            />
          </Card>
        </>
      )}
    </div>
  );
}
