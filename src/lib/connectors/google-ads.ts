// Source: octo-functions/src/data_extractor/insights/google-ads-sync.ts (adapted)
// Google Ads API — OAuth2 refresh_token flow

export interface GoogleAdsCredentials {
  customerId: string;
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface GoogleAdsDayStat {
  campaignId: string;
  campaignName: string;
  status: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  conversionsValue: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ADS_BASE = 'https://googleads.googleapis.com/v17';

async function getAccessToken(creds: GoogleAdsCredentials): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Google OAuth token refresh failed: ${res.status}`);
  const data = await res.json();
  if (!data.access_token) throw new Error('No access_token in Google OAuth response');
  return data.access_token;
}

export async function syncGoogleAds(
  creds: GoogleAdsCredentials,
  since: string,
  until: string
): Promise<GoogleAdsDayStat[]> {
  const accessToken = await getAccessToken(creds);

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm
    FROM campaign
    WHERE segments.date BETWEEN '${since}' AND '${until}'
      AND campaign.status != 'REMOVED'
    ORDER BY segments.date ASC
  `;

  const customerId = creds.customerId.replace(/-/g, '');
  const res = await fetch(`${ADS_BASE}/customers/${customerId}/googleAds:searchStream`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': creds.developerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`Google Ads API failed: ${res.status}`);

  const lines = await res.text();
  const results: GoogleAdsDayStat[] = [];

  for (const line of lines.split('\n').filter(Boolean)) {
    const batch = JSON.parse(line);
    for (const result of batch.results ?? []) {
      const c = result.campaign;
      const m = result.metrics;
      const s = result.segments;
      results.push({
        campaignId: String(c.id),
        campaignName: c.name,
        status: c.status,
        date: s.date,
        impressions: parseInt(m.impressions ?? '0', 10),
        clicks: parseInt(m.clicks ?? '0', 10),
        spend: (parseInt(m.costMicros ?? '0', 10)) / 1_000_000,
        conversions: parseFloat(m.conversions ?? '0'),
        conversionsValue: parseFloat(m.conversionsValue ?? '0'),
        ctr: parseFloat(m.ctr ?? '0') * 100,
        cpc: (parseInt(m.averageCpc ?? '0', 10)) / 1_000_000,
        cpm: (parseInt(m.averageCpm ?? '0', 10)) / 1_000_000,
      });
    }
  }

  return results;
}
