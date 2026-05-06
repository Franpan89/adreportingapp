/**
 * Reports service — uses Supabase when configured, falls back to mock data.
 * All functions are async and safe to call from Server Components.
 */
import type {
  ClientReport,
  ClientReportStatus,
  TopCreative,
  SpendResult,
  AudienceSegment,
  SocialGrowthMetric,
  PeriodTotals,
} from '@/types';
import {
  MOCK_REPORTS,
  getReportsForClient as mockGetReportsForClient,
  getAllReportsForClient as mockGetAllReportsForClient,
  getReportById as mockGetReportById,
  createDemoReport,
} from '@/lib/data/reports';

/* ── Config check ────────────────────────────────── */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.length > 0 && !url.includes('placeholder') && !url.includes('your-project');
}

/* ── Row mapper ──────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): ClientReport {
  return {
    id: row.id,
    client_id: row.client_id,
    title: row.title,
    period_start: row.period_start,
    period_end: row.period_end,
    status: row.status as ClientReportStatus,
    executive_summary: row.executive_summary ?? '',
    top_creatives: (row.top_creatives ?? []) as TopCreative[],
    spend_vs_results: (row.spend_vs_results ?? []) as SpendResult[],
    audiences: (row.audiences ?? []) as AudienceSegment[],
    social_growth: (row.social_growth ?? []) as SocialGrowthMetric[],
    recommendations: row.recommendations ?? '',
    created_by: row.created_by ?? null,
    created_at: row.created_at,
    published_at: row.published_at ?? null,
    client_logo_url: row.client_logo_url ?? null,
    agency_logo_url: row.agency_logo_url ?? null,
    period_totals:   row.period_totals   ?? null,
    agency_name:     row.agency_name     ?? null,
    accent_color:    row.accent_color    ?? null,
  };
}

/* ── Supabase client (lazy import) ───────────────── */
async function getSupabase() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

/* ── READ ─────────────────────────────────────────── */

/** Published reports for a client (client-facing list). */
export async function listReportsForClient(clientId: string): Promise<ClientReport[]> {
  if (!isSupabaseConfigured()) return mockGetReportsForClient(clientId);
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('cr_reports')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error || !data) {
    console.error('[reports] listReportsForClient error:', error?.message);
    return mockGetReportsForClient(clientId);
  }
  return data.map(mapRow);
}

/** All reports for a client (admin view, any status). */
export async function listAllReportsForClient(clientId: string): Promise<ClientReport[]> {
  if (!isSupabaseConfigured()) return mockGetAllReportsForClient(clientId);
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('cr_reports')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error || !data) {
    console.error('[reports] listAllReportsForClient error:', error?.message);
    return mockGetAllReportsForClient(clientId);
  }
  return data.map(mapRow);
}

export async function getReport(id: string): Promise<ClientReport | null> {
  if (!isSupabaseConfigured()) return mockGetReportById(id);
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('cr_reports')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapRow(data);
}

/* ── WRITE ────────────────────────────────────────── */

export interface CreateReportInput {
  client_id: string;
  title: string;
  period_start: string;
  period_end: string;
  client_logo_url?: string | null;
  agency_logo_url?: string | null;
  agency_name?: string | null;
  accent_color?: string | null;
}

export async function createReport(input: CreateReportInput): Promise<ClientReport> {
  if (!isSupabaseConfigured()) {
    // Demo mode: push a realistic mock report into the in-memory store.
    return createDemoReport(input.client_id, input.title, input.period_start, input.period_end);
  }
  const supabase = await getSupabase();
  const base = {
    client_id: input.client_id,
    title: input.title,
    period_start: input.period_start,
    period_end: input.period_end,
    status: 'draft' as const,
    client_logo_url: input.client_logo_url ?? null,
    agency_logo_url: input.agency_logo_url ?? null,
    agency_name:     input.agency_name     ?? null,
    accent_color:    input.accent_color    ?? '#00BD7D',
  };
  let { data, error } = await supabase.from('cr_reports').insert(base).select().single();
  // If logo columns don't exist yet (migration pending), retry without them.
  if (error?.message?.includes('column') && (error.message.includes('client_logo_url') || error.message.includes('agency_logo_url'))) {
    const { client_logo_url, agency_logo_url, ...withoutLogos } = base;
    void client_logo_url; void agency_logo_url;
    ({ data, error } = await supabase.from('cr_reports').insert(withoutLogos).select().single());
  }
  if (error || !data) throw new Error(error?.message ?? 'Error al crear reporte');
  return mapRow(data);
}

export async function updateReportContent(
  id: string,
  content: {
    executive_summary?: string;
    recommendations?: string;
    top_creatives?: unknown[];
    spend_vs_results?: unknown[];
    audiences?: unknown[];
    social_growth?: unknown[];
    period_totals?: PeriodTotals | null;
    agency_name?: string | null;
    accent_color?: string | null;
  },
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = await getSupabase();
  const { error } = await supabase.from('cr_reports').update(content).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateReportStatus(
  id: string,
  status: ClientReportStatus,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    // Mock: mutate in place.
    const target = MOCK_REPORTS.find(r => r.id === id);
    if (target) {
      target.status = status;
      if (status === 'published') target.published_at = new Date().toISOString();
    }
    return;
  }
  const supabase = await getSupabase();
  const update: Record<string, unknown> = { status };
  if (status === 'published') update.published_at = new Date().toISOString();
  const { error } = await supabase.from('cr_reports').update(update).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteReport(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const idx = MOCK_REPORTS.findIndex(r => r.id === id);
    if (idx >= 0) MOCK_REPORTS.splice(idx, 1);
    return;
  }
  const supabase = await getSupabase();
  const { error } = await supabase.from('cr_reports').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
