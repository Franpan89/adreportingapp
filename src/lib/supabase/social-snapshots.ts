/**
 * Social follower snapshots.
 *
 * Meta deprecated the page_fans Insights metric in late 2024 and
 * instagram_manage_insights is hard to get approved. So we maintain our own
 * daily follower history: every time the app talks to Meta we upsert today's
 * count into cr_social_snapshots, and reports/dashboards compute growth from
 * the snapshots inside the report period.
 */
import { fetchMetaConnectedPages } from '@/lib/connectors/meta';
import { decrypt } from '@/lib/utils/encrypt';
import type { SocialGrowthMetric } from '@/types';

type Platform = 'facebook' | 'instagram';

interface SnapshotRow {
  client_id:   string;
  platform:    Platform;
  page_id:     string;
  page_name:   string | null;
  followers:   number;
  captured_on: string;
}

/**
 * Resolve a Meta access token for a client:
 *   1) per-client encrypted credential
 *   2) agency-level Meta connection
 */
export async function resolveClientMetaToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  clientId: string,
  userId: string | null,
): Promise<string | null> {
  const { data: credRow } = await supabase
    .from('cr_channel_credentials')
    .select('credentials_enc')
    .eq('client_id', clientId)
    .eq('channel', 'meta_ads')
    .eq('is_active', true)
    .single()
    .then((r: unknown) => r, () => ({ data: null }));

  if (credRow?.credentials_enc) {
    try {
      const creds = JSON.parse(decrypt(credRow.credentials_enc)) as Record<string, string>;
      if (creds.access_token) return creds.access_token;
    } catch { /* fall through */ }
  }

  if (!userId) return null;

  const { data: agConn } = await supabase
    .from('agency_meta_connections')
    .select('access_token_enc')
    .eq('admin_user_id', userId)
    .single()
    .then((r: unknown) => r, () => ({ data: null }));

  if (agConn?.access_token_enc) {
    try { return decrypt(agConn.access_token_enc); } catch { /* ignore */ }
  }
  return null;
}

/**
 * Fetch current follower counts for all Meta pages + IG accounts the token
 * can access, and upsert today's snapshot. Idempotent within a single day.
 * Silent on failure — caller never breaks.
 */
export async function captureMetaSocialSnapshots(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  clientId: string,
  accessToken: string,
): Promise<void> {
  try {
    const pages = await fetchMetaConnectedPages(accessToken);
    if (pages.length === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const rows: SnapshotRow[] = [];

    for (const page of pages.slice(0, 5)) {
      const fb = page.followers_count ?? page.fan_count;
      if (typeof fb === 'number' && fb > 0) {
        rows.push({
          client_id:   clientId,
          platform:    'facebook',
          page_id:     page.id,
          page_name:   page.name ?? null,
          followers:   fb,
          captured_on: today,
        });
      }
      const ig = page.instagram_business_account;
      if (ig && typeof ig.followers_count === 'number' && ig.followers_count > 0) {
        rows.push({
          client_id:   clientId,
          platform:    'instagram',
          page_id:     ig.id,
          page_name:   ig.name ?? null,
          followers:   ig.followers_count,
          captured_on: today,
        });
      }
    }

    if (rows.length === 0) return;
    const { error } = await supabase
      .from('cr_social_snapshots')
      .upsert(rows, { onConflict: 'client_id,platform,page_id,captured_on' });
    if (error) console.warn('[social-snapshots] upsert failed:', error.message);
  } catch (err) {
    console.warn('[social-snapshots] capture failed:', err instanceof Error ? err.message : err);
  }
}

interface RawSnapshot { platform: Platform; page_id: string; followers: number; captured_on: string }

/**
 * Compute growth per platform in the report period from stored snapshots.
 * If only one snapshot exists, returns it as start = end (0% growth) so the
 * report at least shows the current follower count.
 */
export async function getSocialGrowthFromSnapshots(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  clientId: string,
  periodStart: string,
  periodEnd: string,
): Promise<SocialGrowthMetric[]> {
  const { data: rows } = await supabase
    .from('cr_social_snapshots')
    .select('platform, page_id, followers, captured_on')
    .eq('client_id', clientId)
    .lte('captured_on', periodEnd)
    .order('captured_on', { ascending: true });

  const all = (rows ?? []) as RawSnapshot[];
  if (all.length === 0) return [];

  // For each platform: take the earliest snapshot ≥ periodStart as the start,
  // and the latest snapshot ≤ periodEnd as the end. If no snapshot exists
  // inside the period, fall back to the most recent one before periodStart.
  const platforms: Platform[] = ['facebook', 'instagram'];
  const result: SocialGrowthMetric[] = [];

  for (const platform of platforms) {
    const byPage = new Map<string, RawSnapshot[]>();
    for (const r of all.filter(x => x.platform === platform)) {
      const arr = byPage.get(r.page_id) ?? [];
      arr.push(r);
      byPage.set(r.page_id, arr);
    }

    // Aggregate followers across pages of the same platform (rare to have >1, but
    // sum is the sensible cross-page total).
    let startSum = 0;
    let endSum   = 0;
    let hasData  = false;

    for (const arr of byPage.values()) {
      const inPeriod = arr.filter(r => r.captured_on >= periodStart);
      const startRow = inPeriod[0] ?? arr[arr.length - 1]; // most recent pre-period as fallback
      const endRow   = inPeriod[inPeriod.length - 1] ?? startRow;
      if (!startRow || !endRow) continue;
      startSum += startRow.followers;
      endSum   += endRow.followers;
      hasData = true;
    }

    if (!hasData) continue;
    const pct = startSum > 0 ? Math.round(((endSum - startSum) / startSum) * 10000) / 100 : 0;
    result.push({ platform, followers_start: startSum, followers_end: endSum, growth_pct: pct });
  }

  return result;
}
