// Source: wmm-client-intel/functions/src/connectors/tiktok-ads.js (TypeScript rewrite)
// TikTok Business API v1.3

export interface TikTokCredentials {
  advertiserId: string;
  accessToken: string;
}

export interface TikTokDayStat {
  campaignId: string;
  campaignName: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  videoViews: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

const BASE = 'https://business-api.tiktok.com/open_api/v1.3';

export async function syncTikTok(
  creds: TikTokCredentials,
  since: string,
  until: string
): Promise<TikTokDayStat[]> {
  const body = {
    advertiser_id: creds.advertiserId,
    report_type: 'BASIC',
    data_level: 'AUCTION_CAMPAIGN',
    dimensions: ['campaign_id', 'stat_time_day'],
    metrics: [
      'campaign_name', 'impressions', 'clicks', 'spend',
      'reach', 'video_play_actions', 'conversion',
      'ctr', 'cpc', 'cpm',
    ],
    start_date: since,
    end_date: until,
    page_size: 200,
  };

  const res = await fetch(`${BASE}/report/integrated/get/`, {
    method: 'POST',
    headers: {
      'Access-Token': creds.accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`TikTok API fetch failed: ${res.status}`);
  const data = await res.json();
  if (data.code !== 0) throw new Error(`TikTok API error ${data.code}: ${data.message}`);

  return (data.data?.list ?? []).map((row: Record<string, Record<string, string>>) => {
    const d = row.dimensions ?? {};
    const m = row.metrics ?? {};
    return {
      campaignId: d.campaign_id ?? '',
      campaignName: m.campaign_name ?? '',
      date: d.stat_time_day?.split(' ')[0] ?? '',
      impressions: parseInt(m.impressions ?? '0', 10),
      clicks: parseInt(m.clicks ?? '0', 10),
      spend: parseFloat(m.spend ?? '0'),
      reach: parseInt(m.reach ?? '0', 10),
      videoViews: parseInt(m.video_play_actions ?? '0', 10),
      conversions: parseInt(m.conversion ?? '0', 10),
      ctr: parseFloat(m.ctr ?? '0'),
      cpc: parseFloat(m.cpc ?? '0'),
      cpm: parseFloat(m.cpm ?? '0'),
    };
  });
}
