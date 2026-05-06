import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel') ?? 'meta_ads';
  const since   = searchParams.get('since')   ?? new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const until   = searchParams.get('until')   ?? new Date().toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  // Join cr_ads ← cr_campaigns for campaign name, aggregate cr_ad_daily_stats over period.
  const { data: rows, error } = await supabase
    .from('cr_ads')
    .select(`
      id,
      name,
      thumbnail_url,
      creative_type,
      cr_campaigns!inner ( name ),
      cr_ad_daily_stats ( impressions, reach, clicks, spend, video_views )
    `)
    .eq('client_id', clientId)
    .eq('channel', channel)
    .gte('cr_ad_daily_stats.date', since)
    .lte('cr_ad_daily_stats.date', until);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate daily rows into period totals per ad.
  // Only include ads that have at least one stat row in the requested period.
  const ads = (rows ?? [])
    .filter(ad => (ad.cr_ad_daily_stats ?? []).length > 0)
    .map(ad => {
      const stats = (ad.cr_ad_daily_stats ?? []) as Array<{
        impressions: number; reach: number; clicks: number; spend: number; video_views: number; conversions: number;
      }>;
      const totals = stats.reduce(
        (acc, s) => ({
          impressions:  acc.impressions  + (s.impressions  ?? 0),
          reach:        acc.reach        + (s.reach        ?? 0),
          clicks:       acc.clicks       + (s.clicks       ?? 0),
          spend:        acc.spend        + (s.spend        ?? 0),
          video_views:  acc.video_views  + (s.video_views  ?? 0),
          conversions:  acc.conversions  + (s.conversions  ?? 0),
        }),
        { impressions: 0, reach: 0, clicks: 0, spend: 0, video_views: 0, conversions: 0 },
      );
      return {
        id:            ad.id,
        ad_name:       ad.name,
        campaign_name: (ad.cr_campaigns as unknown as { name: string } | null)?.name ?? '',
        thumbnail_url: ad.thumbnail_url,
        creative_type: ad.creative_type,
        ...totals,
      };
    });

  // Sort by spend descending.
  ads.sort((a, b) => b.spend - a.spend);

  return NextResponse.json({ ads });
}
