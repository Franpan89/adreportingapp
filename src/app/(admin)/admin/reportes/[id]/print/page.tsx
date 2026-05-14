import { notFound } from 'next/navigation';
import { AutoPrint } from './_components/AutoPrint';
import { ReportView } from '@/components/reports/ReportView';
import { getReport } from '@/lib/supabase/reports';
import { createClient as createSupabase } from '@/lib/supabase/server';
import { decrypt } from '@/lib/utils/encrypt';
import {
  fetchMetaConnectedPages,
  fetchPageFans,
  fetchIgFollowerHistory,
} from '@/lib/connectors/meta';
import type { TopCreative, PeriodTotals, SocialGrowthMetric, Channel } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

type StatRow = { spend?: number; conversions?: number; impressions?: number; clicks?: number };

export default async function PrintPage({ params }: PageProps) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const supabase = await createSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Client name
  const { data: clientRow } = await supabase
    .from('cr_clients').select('name').eq('id', report.client_id).single()
    .then(r => r, () => ({ data: null }));
  const clientName: string | undefined = (clientRow as { name?: string } | null)?.name ?? undefined;

  // Agency color + name override
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

  // Period totals (computed on the fly if missing)
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

  // Top creatives (live from DB)
  const { data: adRows } = await supabase
    .from('cr_ads')
    .select('name, channel, thumbnail_url, full_picture_url, cr_ad_daily_stats(spend, conversions, impressions, clicks)')
    .eq('client_id', report.client_id)
    .gte('cr_ad_daily_stats.date', report.period_start)
    .lte('cr_ad_daily_stats.date', report.period_end);

  if (adRows?.length) {
    const mapped: TopCreative[] = (adRows as Array<{
      name: string; channel: string; thumbnail_url?: string | null;
      full_picture_url?: string | null; cr_ad_daily_stats?: StatRow[];
    }>)
      .map(ad => {
        const s: StatRow[] = ad.cr_ad_daily_stats ?? [];
        const spend       = s.reduce((a, r) => a + (Number(r.spend)       || 0), 0);
        const conversions = s.reduce((a, r) => a + (Number(r.conversions) || 0), 0);
        const impressions = s.reduce((a, r) => a + (Number(r.impressions) || 0), 0);
        const clicks      = s.reduce((a, r) => a + (Number(r.clicks)      || 0), 0);
        return {
          name:             ad.name,
          channel:          ad.channel as Channel,
          thumbnail_url:    ad.thumbnail_url ?? null,
          full_picture_url: ad.full_picture_url ?? null,
          spend:            Math.round(spend * 100) / 100,
          conversions:      Math.round(conversions),
          impressions,
          ctr:              impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
        };
      })
      .filter(a => a.spend > 0 || a.conversions > 0)
      .sort((a, b) => b.conversions - a.conversions || b.spend - a.spend);
    if (mapped.length) report.top_creatives = mapped;
  }

  // Social growth (optional)
  if (!report.social_growth?.length) {
    try {
      let accessToken: string | null = null;
      const { data: credRow } = await supabase
        .from('cr_channel_credentials')
        .select('credentials_enc')
        .eq('client_id', report.client_id)
        .eq('channel', 'meta_ads')
        .eq('is_active', true)
        .single()
        .then(r => r, () => ({ data: null }));
      if (credRow?.credentials_enc) {
        const creds = JSON.parse(decrypt(credRow.credentials_enc)) as Record<string, string>;
        if (creds.access_token) accessToken = creds.access_token;
      }
      if (!accessToken && user) {
        const { data: agConn } = await supabase
          .from('agency_meta_connections')
          .select('access_token_enc')
          .eq('admin_user_id', user.id)
          .single()
          .then(r => r, () => ({ data: null }));
        if (agConn?.access_token_enc) accessToken = decrypt(agConn.access_token_enc);
      }
      if (accessToken) {
        const pages = await fetchMetaConnectedPages(accessToken);
        const growthRows: SocialGrowthMetric[] = [];
        for (const page of pages.slice(0, 3)) {
          const pageToken = page.access_token ?? accessToken;
          try {
            const fans = await fetchPageFans(page.id, pageToken, report.period_start, report.period_end);
            if (fans.length >= 2) {
              const start = fans[0].value;
              const end   = fans[fans.length - 1].value;
              const pct   = start > 0 ? Math.round(((end - start) / start) * 10000) / 100 : 0;
              growthRows.push({ platform: 'facebook', followers_start: start, followers_end: end, growth_pct: pct });
            }
          } catch (err) {
            console.warn('[print/social-growth] Facebook failed:', err instanceof Error ? err.message : err);
          }
          const igId = page.instagram_business_account?.id;
          if (igId) {
            try {
              const igFans = await fetchIgFollowerHistory(igId, pageToken, report.period_start, report.period_end);
              if (igFans.length >= 2) {
                const start = igFans[0].value;
                const end   = igFans[igFans.length - 1].value;
                const pct   = start > 0 ? Math.round(((end - start) / start) * 10000) / 100 : 0;
                growthRows.push({ platform: 'instagram', followers_start: start, followers_end: end, growth_pct: pct });
              }
            } catch (err) {
              console.warn('[print/social-growth] Instagram failed:', err instanceof Error ? err.message : err);
            }
          }
        }
        if (growthRows.length) report.social_growth = growthRows;
      }
    } catch { /* social growth is optional */ }
  }

  return (
    <div className="bg-white">
      <AutoPrint />
      <ReportView report={report} clientName={clientName} />
    </div>
  );
}
