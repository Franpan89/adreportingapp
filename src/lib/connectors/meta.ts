// Meta Graph API connector — pure data fetching, no Supabase or auth.
//
// Consumers (sync route, agency Meta connection routes) supply an access
// token; this module knows the wire protocol. v21.0 is the version that has
// shipped with the agency-token + per-client-token sync flow on origin/master.

export const META_API_BASE = 'https://graph.facebook.com/v21.0';

export interface MetaAction {
  action_type: string;
  value: string;
}

export interface MetaInsightRow {
  date_start: string;
  campaign_id: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
}

export interface MetaCampaign {
  id: string;
  name?: string;
  status?: string;
  objective?: string;
  adsets?: { data?: Array<{ optimization_goal?: string; destination_type?: string }> };
}

export interface MetaAdAccountSummary {
  id: string;
  name: string;
  account_status: number;
  currency: string;
}

const MESSAGING_OPTIMIZATION_GOALS = new Set([
  'CONVERSATIONS',
  'REPLY_MESSAGING',
  'MESSAGING_APPOINTMENT_CONVERSION',
  'MESSAGING_PURCHASE_CONVERSION',
]);

const MESSAGING_DESTINATION_TYPES = new Set(['MESSENGER', 'WHATSAPP', 'INSTAGRAM_DIRECT']);

/** Sum the `value` of actions whose `action_type` is in `types`. */
export function sumActions(arr: MetaAction[] | undefined, types: string[]): number {
  if (!arr) return 0;
  return arr
    .filter(a => types.includes(a.action_type))
    .reduce((s, a) => s + parseFloat(a.value ?? '0'), 0);
}

/** OUTCOME_ENGAGEMENT splits into a messaging variant when adsets indicate so. */
export function resolveObjectiveKey(campaign: MetaCampaign): string {
  const base = campaign.objective ?? '';
  if (base !== 'OUTCOME_ENGAGEMENT') return base;
  const adsets = campaign.adsets?.data ?? [];
  const isMessaging = adsets.some(
    a =>
      MESSAGING_OPTIMIZATION_GOALS.has(a.optimization_goal ?? '') ||
      MESSAGING_DESTINATION_TYPES.has(a.destination_type ?? ''),
  );
  return isMessaging ? 'OUTCOME_ENGAGEMENT_CONVERSATIONS' : base;
}

/** Walk Graph API paging.next links and concatenate `data` arrays. */
export async function fetchAllMeta<T = unknown>(url: string): Promise<T[]> {
  const results: T[] = [];
  let next: string | null = url;
  while (next) {
    const res = await fetch(next);
    const data = (await res.json()) as { data?: T[]; paging?: { next?: string }; error?: { message: string } };
    if (data.error) throw new Error(`Meta API: ${data.error.message}`);
    results.push(...(data.data ?? []));
    next = data.paging?.next ?? null;
  }
  return results;
}

/** Normalize a raw account_id ("123" or "act_123") to the canonical "act_123" form. */
export function normalizeAdAccountId(account_id: string): string {
  return account_id.startsWith('act_') ? account_id : `act_${account_id}`;
}

/** Fetch campaigns + adset signals needed for objective resolution. */
export async function fetchMetaCampaigns(
  account_id: string,
  access_token: string,
): Promise<MetaCampaign[]> {
  const params = new URLSearchParams({
    fields: 'id,name,status,objective,adsets{optimization_goal,destination_type}',
    limit: '500',
    access_token,
  });
  return fetchAllMeta<MetaCampaign>(
    `${META_API_BASE}/${normalizeAdAccountId(account_id)}/campaigns?${params}`,
  );
}

export interface MetaAd {
  id: string;
  name?: string;
  campaign_id?: string;
  creative?: {
    thumbnail_url?: string;
    object_type?: string;
    full_picture?: string;
  };
}

export interface MetaAdInsightRow {
  date_start: string;
  ad_id: string;
  campaign_id: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  actions?: MetaAction[];
}

/** Fetch ads with creative thumbnails for an account. */
export async function fetchMetaAds(
  account_id: string,
  access_token: string,
): Promise<MetaAd[]> {
  const params = new URLSearchParams({
    fields: 'id,name,campaign_id,creative{thumbnail_url,object_type}',
    limit: '500',
    access_token,
  });
  return fetchAllMeta<MetaAd>(
    `${META_API_BASE}/${normalizeAdAccountId(account_id)}/ads?${params}`,
  );
}

/** Daily ad-level insights for [since, until]. */
export async function fetchMetaAdInsights(
  account_id: string,
  access_token: string,
  since: string,
  until: string,
): Promise<MetaAdInsightRow[]> {
  const params = new URLSearchParams({
    fields: 'ad_id,campaign_id,impressions,clicks,spend,reach,actions',
    level: 'ad',
    time_range: JSON.stringify({ since, until }),
    time_increment: '1',
    limit: '500',
    access_token,
  });
  return fetchAllMeta<MetaAdInsightRow>(
    `${META_API_BASE}/${normalizeAdAccountId(account_id)}/insights?${params}`,
  );
}

/** Daily campaign-level insights for [since, until]. */
export async function fetchMetaInsights(
  account_id: string,
  access_token: string,
  since: string,
  until: string,
): Promise<MetaInsightRow[]> {
  const params = new URLSearchParams({
    fields: 'campaign_id,impressions,clicks,spend,reach,actions,action_values',
    level: 'campaign',
    time_range: JSON.stringify({ since, until }),
    time_increment: '1',
    limit: '500',
    access_token,
  });
  return fetchAllMeta<MetaInsightRow>(
    `${META_API_BASE}/${normalizeAdAccountId(account_id)}/insights?${params}`,
  );
}

/** List ad accounts the token has access to (for the agency connector setup). */
export async function fetchMetaAdAccounts(access_token: string): Promise<MetaAdAccountSummary[]> {
  const params = new URLSearchParams({
    fields: 'id,name,account_status,currency',
    limit: '200',
    access_token,
  });
  const res = await fetch(`${META_API_BASE}/me/adaccounts?${params}`);
  const json = (await res.json()) as {
    data?: Array<{ id: string; name: string; account_status: string | number; currency: string }>;
    error?: { message: string };
  };
  if (json.error) throw new Error(json.error.message);
  return (json.data ?? []).map(a => ({
    id: a.id,
    name: a.name,
    account_status: Number(a.account_status),
    currency: a.currency,
  }));
}

/** Confirm a token is valid by hitting /me/adaccounts with limit=1. Returns the error string if invalid. */
export async function verifyMetaToken(access_token: string): Promise<string | null> {
  const url = `${META_API_BASE}/me/adaccounts?fields=id&limit=1&access_token=${encodeURIComponent(access_token)}`;
  const res = await fetch(url);
  const data = (await res.json()) as { error?: { message: string } };
  return data.error?.message ?? null;
}

export interface MetaPage {
  id: string;
  name: string;
  access_token?: string; // page-scoped token — required for Page Insights
  instagram_business_account?: { id: string; name?: string; followers_count?: number } | null;
}

/** Pages the token's user manages. Needs pages_read_engagement or pages_show_list. */
export async function fetchMetaConnectedPages(access_token: string): Promise<MetaPage[]> {
  const params = new URLSearchParams({
    fields: 'id,name,access_token,instagram_business_account{id,name,followers_count}',
    limit: '50',
    access_token,
  });
  try {
    return await fetchAllMeta<MetaPage>(`${META_API_BASE}/me/accounts?${params}`);
  } catch {
    return [];
  }
}

export interface PageFanValue { value: number; end_time: string }

/** Daily page_fans metric for a Facebook Page. Returns [{value, end_time}]. */
export async function fetchPageFans(
  pageId: string,
  access_token: string,
  since: string,
  until: string,
): Promise<PageFanValue[]> {
  const params = new URLSearchParams({
    metric: 'page_fans',
    period: 'day',
    since,
    until,
    access_token,
  });
  const res = await fetch(`${META_API_BASE}/${pageId}/insights?${params}`);
  const json = (await res.json()) as {
    data?: Array<{ name: string; values?: PageFanValue[] }>;
    error?: { message: string };
  };
  if (json.error) throw new Error(json.error.message);
  return json.data?.find(d => d.name === 'page_fans')?.values ?? [];
}

/** Daily follower_count for an Instagram Business Account. */
export async function fetchIgFollowerHistory(
  igAccountId: string,
  access_token: string,
  since: string,
  until: string,
): Promise<PageFanValue[]> {
  const params = new URLSearchParams({
    metric: 'follower_count',
    period: 'day',
    since,
    until,
    access_token,
  });
  const res = await fetch(`${META_API_BASE}/${igAccountId}/insights?${params}`);
  const json = (await res.json()) as {
    data?: Array<{ name: string; values?: PageFanValue[] }>;
    error?: { message: string };
  };
  if (json.error) return [];
  return json.data?.find(d => d.name === 'follower_count')?.values ?? [];
}
