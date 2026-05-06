/**
 * License service — uses Supabase when configured, falls back to mock data.
 * All functions are async and safe to call from Server Components.
 */
import type { License, LicenseAddons, LicenseStatus, PlanId } from '@/types';
import { MOCK_LICENSES, PLANS, getPlanById, MONTHLY_NEW_LICENSES } from '@/lib/data/licenses';

/* ── Config check ────────────────────────────────── */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.length > 0 && !url.includes('placeholder') && !url.includes('your-project');
}

/* ── Row mapper ──────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): License {
  return {
    id:            row.id,
    agency_id:     row.agency_user_id ?? row.id,
    agency_name:   row.agency_name,
    agency_email:  row.agency_email,
    plan_id:       row.plan_id as PlanId,
    status:        row.status as LicenseStatus,
    created_at:    row.created_at,
    expires_at:    row.expires_at ?? null,
    activated_at:  row.activated_at ?? null,
    notes:         row.notes ?? null,
    clients_count: row.clients_count ?? 0,
    temp_password: row.temp_password ?? null,
    addons: (row.addons as LicenseAddons) ?? {},
  };
}

/* ── Supabase client (lazy import to avoid SSR issues) ── */
async function getSupabase() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

/* ── READ ─────────────────────────────────────────── */

export async function getLicenses(): Promise<License[]> {
  if (!isSupabaseConfigured()) return MOCK_LICENSES;
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) {
    console.error('[licenses] getLicenses error:', error?.message);
    return MOCK_LICENSES;
  }
  return data.map(mapRow);
}

export async function getLicenseById(id: string): Promise<License | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_LICENSES.find(l => l.id === id) ?? null;
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapRow(data);
}

export async function getLicenseByAgencyUserId(userId: string): Promise<License | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_LICENSES.find(l => l.agency_id === userId) ?? MOCK_LICENSES[0] ?? null;
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('agency_user_id', userId)
    .single();
  if (error || !data) return null;
  return mapRow(data);
}

export async function getLicensesByStatusAsync(status: LicenseStatus): Promise<License[]> {
  const all = await getLicenses();
  return all.filter(l => l.status === status);
}

export async function getExpiringLicensesAsync(withinDays: number): Promise<License[]> {
  const all = await getLicenses();
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);
  return all.filter(l => {
    if (!l.expires_at || l.status !== 'active') return false;
    const exp = new Date(l.expires_at);
    return exp >= now && exp <= cutoff;
  });
}

export async function getRecentLicensesAsync(count: number): Promise<License[]> {
  const all = await getLicenses();
  return [...all]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, count);
}

export async function getMRRAsync(): Promise<number> {
  const all = await getLicenses();
  return all
    .filter(l => l.status === 'active' || l.status === 'trial')
    .reduce((acc, l) => acc + getPlanById(l.plan_id).price_monthly, 0);
}

export async function getMonthlyLicenseCounts(): Promise<{ mes: string; cantidad: number }[]> {
  if (!isSupabaseConfigured()) return MONTHLY_NEW_LICENSES;
  const supabase = await getSupabase();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const { data } = await supabase
    .from('licenses')
    .select('created_at')
    .gte('created_at', sixMonthsAgo.toISOString());
  if (!data || data.length === 0) return MONTHLY_NEW_LICENSES;
  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const counts: Record<string, number> = {};
  data.forEach(row => {
    const key = monthNames[new Date(row.created_at).getMonth()];
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return Object.entries(counts).map(([mes, cantidad]) => ({ mes, cantidad }));
}

/* ── WRITE (used by API routes) ───────────────────── */

export interface CreateLicenseInput {
  agency_name: string;
  agency_email: string;
  plan_id: PlanId;
  temp_password: string;
  expires_at?: string | null;
  notes?: string | null;
  agency_user_id?: string | null;
}

export async function createLicense(input: CreateLicenseInput): Promise<License> {
  if (!isSupabaseConfigured()) {
    // Mock create — returns ephemeral object
    const mock: License = {
      id: `lic-${Date.now()}`,
      agency_id: `ag-${Date.now()}`,
      agency_name: input.agency_name,
      agency_email: input.agency_email,
      plan_id: input.plan_id,
      status: 'trial',
      created_at: new Date().toISOString(),
      expires_at: input.expires_at ?? null,
      activated_at: new Date().toISOString(),
      notes: input.notes ?? null,
      clients_count: 0,
      temp_password: input.temp_password,
      addons: {},
    };
    return mock;
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('licenses')
    .insert({
      agency_name:    input.agency_name,
      agency_email:   input.agency_email,
      plan_id:        input.plan_id,
      temp_password:  input.temp_password,
      expires_at:     input.expires_at ?? null,
      notes:          input.notes ?? null,
      status:         'trial',
      activated_at:   new Date().toISOString(),
      agency_user_id: input.agency_user_id ?? null,
    })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Error al crear licencia');
  return mapRow(data);
}

export async function updateLicenseStatus(id: string, status: LicenseStatus): Promise<void> {
  if (!isSupabaseConfigured()) return; // mock — no-op
  const supabase = await getSupabase();
  const update: Record<string, unknown> = { status };
  if (status === 'active') update.activated_at = new Date().toISOString();
  const { error } = await supabase.from('licenses').update(update).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateLicenseAddons(id: string, addons: LicenseAddons): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = await getSupabase();
  const { error } = await supabase.from('licenses').update({ addons }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function revokeLicense(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return; // mock — no-op
  const supabase = await getSupabase();
  const { error } = await supabase.from('licenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* Re-export plan helpers so pages only need one import */
export { PLANS, getPlanById };
export type { LicenseAddons };
