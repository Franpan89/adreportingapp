import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getReport } from '@/lib/supabase/reports';
import { ReportView } from '@/components/reports/ReportView';
import { DownloadPdfButton } from '@/components/reports/DownloadPdfButton';
import { createClient as createSupabase } from '@/lib/supabase/server';
import {
  resolveClientMetaToken,
  captureMetaSocialSnapshots,
  getSocialGrowthFromSnapshots,
} from '@/lib/supabase/social-snapshots';
import type { TopCreative, PeriodTotals, Channel } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

type StatRow = { spend?: number; conversions?: number; impressions?: number; clicks?: number };

export default async function AdminReporteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const supabase = await createSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // ── 0. Fetch client name for cover/header ──────────────────────────────────
  const { data: clientRow } = await supabase
    .from('cr_clients')
    .select('name')
    .eq('id', report.client_id)
    .single()
    .then(r => r, () => ({ data: null }));
  const clientName: string | undefined = (clientRow as { name?: string } | null)?.name ?? undefined;

  // ── 1. Always override color + name from current agency settings ───────────
  if (user) {
    const { data: ag } = await supabase
      .from('cr_agency_settings')
      .select('primary_color, agency_name')
      .eq('admin_user_id', user.id)
      .single()
      .then(r => r, () => ({ data: null }));
    if (ag?.primary_color) report.accent_color = ag.primary_color;
    if (ag?.agency_name)   report.agency_name  = ag.agency_name;
  }

  // ── 2. Compute period_totals on the fly if missing ────────────────────────
  if (!report.period_totals) {
    const { data: stats } = await supabase
      .from('cr_daily_stats')
      .select('spend, conversions, impressions, reach, link_clicks, video_views')
      .eq('client_id', report.client_id)
      .gte('date', report.period_start)
      .lte('date', report.period_end);

    if (stats?.length) {
      const sum = (key: keyof typeof stats[0]) =>
        stats.reduce((a, r) => a + (Number(r[key]) || 0), 0);
      report.period_totals = {
        spend:        Math.round(sum('spend') * 100) / 100,
        conversions:  Math.round(sum('conversions')),
        impressions:  Math.round(sum('impressions')),
        reach:        Math.round(sum('reach')),
        interactions: Math.round(sum('link_clicks') + sum('video_views')),
      } satisfies PeriodTotals;
    }
  }

  // ── 3. Live-fetch ALL creatives for the period (no limit) ─────────────────
  const { data: adRows } = await supabase
    .from('cr_ads')
    .select('name, channel, thumbnail_url, cr_ad_daily_stats(spend, conversions, impressions, clicks)')
    .eq('client_id', report.client_id)
    .gte('cr_ad_daily_stats.date', report.period_start)
    .lte('cr_ad_daily_stats.date', report.period_end);

  if (adRows?.length) {
    const mapped: TopCreative[] = (adRows as Array<{
      name: string;
      channel: string;
      thumbnail_url?: string | null;
      cr_ad_daily_stats?: StatRow[];
    }>)
      .map(ad => {
        const s: StatRow[] = ad.cr_ad_daily_stats ?? [];
        const spend       = s.reduce((a, r) => a + (Number(r.spend)       || 0), 0);
        const conversions = s.reduce((a, r) => a + (Number(r.conversions) || 0), 0);
        const impressions = s.reduce((a, r) => a + (Number(r.impressions) || 0), 0);
        const clicks      = s.reduce((a, r) => a + (Number(r.clicks)      || 0), 0);
        return {
          name:          ad.name,
          channel:       ad.channel as Channel,
          thumbnail_url: ad.thumbnail_url ?? null,
          spend:         Math.round(spend * 100) / 100,
          conversions:   Math.round(conversions),
          impressions,
          ctr:           impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
        };
      })
      .filter(a => a.spend > 0 || a.conversions > 0)
      .sort((a, b) => b.conversions - a.conversions || b.spend - a.spend);

    if (mapped.length) report.top_creatives = mapped;
  }

  // ── 4. Social growth from our snapshot history ────────────────────────────
  // Meta deprecated the page_fans Insights metric, so we capture our own daily
  // snapshots from the live followers_count field and compute growth from them.
  if (!report.social_growth?.length) {
    const accessToken = await resolveClientMetaToken(supabase, report.client_id, user?.id ?? null);
    if (accessToken) {
      await captureMetaSocialSnapshots(supabase, report.client_id, accessToken);
    }
    const growth = await getSocialGrowthFromSnapshots(
      supabase,
      report.client_id,
      report.period_start,
      report.period_end,
    );
    if (growth.length) report.social_growth = growth;
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F9FAFB]">
      <div className="print:hidden border-b border-[#E5E7EB] bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link
          href={`/admin/clients/${report.client_id}/reportes`}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a reportes
        </Link>
        <DownloadPdfButton reportId={report.id} />
      </div>

      <div id="report-print-area" className="flex-1 px-6 py-8 print:p-0">
        <ReportView report={report} clientName={clientName} />
      </div>
    </div>
  );
}
