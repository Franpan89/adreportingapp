// Source: wmm-client-intel/functions/src/connectors/google-analytics.js (TypeScript rewrite)
// Uses @google-analytics/data — Data API v1beta

import { BetaAnalyticsDataClient } from '@google-analytics/data';

export interface GA4Credentials {
  propertyId: string;
  serviceAccountEmail: string;
  serviceAccountKey: string;
}

export interface GA4DayStat {
  date: string;
  sessions: number;
  users: number;
  conversions: number;
  revenue: number;
}

function buildClient(creds: GA4Credentials): BetaAnalyticsDataClient {
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: creds.serviceAccountEmail,
      private_key: creds.serviceAccountKey.replace(/\\n/g, '\n'),
    },
  });
}

export async function syncGA4(
  creds: GA4Credentials,
  since: string,
  until: string
): Promise<GA4DayStat[]> {
  const client = buildClient(creds);

  const [response] = await client.runReport({
    property: `properties/${creds.propertyId}`,
    dateRanges: [{ startDate: since, endDate: until }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'conversions' },
      { name: 'purchaseRevenue' },
    ],
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
  });

  return (response.rows ?? []).map(row => {
    const dims = row.dimensionValues ?? [];
    const vals = row.metricValues ?? [];
    const rawDate = dims[0]?.value ?? '';
    return {
      date: `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`,
      sessions: parseInt(vals[0]?.value ?? '0', 10),
      users: parseInt(vals[1]?.value ?? '0', 10),
      conversions: parseFloat(vals[2]?.value ?? '0'),
      revenue: parseFloat(vals[3]?.value ?? '0'),
    };
  });
}
