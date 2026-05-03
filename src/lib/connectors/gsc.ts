// Source: wmm-client-intel/functions/src/connectors/search-console.js (TypeScript rewrite)
// Google Search Console API v3 — same service account as GA4

import { google } from 'googleapis';

export interface GSCCredentials {
  siteUrl: string;
  serviceAccountEmail: string;
  serviceAccountKey: string;
}

export interface GSCDayStat {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function syncGSC(
  creds: GSCCredentials,
  since: string,
  until: string
): Promise<GSCDayStat[]> {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: creds.serviceAccountEmail,
      private_key: creds.serviceAccountKey.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const res = await searchconsole.searchanalytics.query({
    siteUrl: creds.siteUrl,
    requestBody: {
      startDate: since,
      endDate: until,
      dimensions: ['date'],
      rowLimit: 500,
    },
  });

  return (res.data.rows ?? []).map(row => {
    const keys = row.keys ?? [];
    return {
      date: keys[0] ?? '',
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    };
  });
}
