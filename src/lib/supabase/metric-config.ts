/**
 * Per-client metric config service.
 *
 * The catalog of metrics (key, label, unit) lives in DEFAULT_METRIC_CONFIG.
 * What's stored per-client in cr_client_metric_config is just the overrides:
 * visibility, display order, KPI/table/chart inclusion. Read merges defaults
 * with overrides; save upserts the full set.
 */
import type { MetricConfig } from '@/types';
import { DEFAULT_METRIC_CONFIG } from '@/lib/metrics/definitions';

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.length > 0 && !url.includes('placeholder') && !url.includes('your-project');
}

async function getSupabase() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

interface ConfigRow {
  metric_key: string;
  is_visible: boolean;
  display_order: number;
  show_in_kpi: boolean;
  show_in_table: boolean;
  show_in_chart: boolean;
}

/** Load merged config: DEFAULT_METRIC_CONFIG with any per-client row overrides. */
export async function getMetricConfigForClient(clientId: string): Promise<MetricConfig[]> {
  if (!isSupabaseConfigured()) return DEFAULT_METRIC_CONFIG;

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('cr_client_metric_config')
    .select('metric_key, is_visible, display_order, show_in_kpi, show_in_table, show_in_chart')
    .eq('client_id', clientId);

  if (error || !data) {
    console.error('[metric-config] read error:', error?.message);
    return DEFAULT_METRIC_CONFIG;
  }

  const rowsByKey = new Map<string, ConfigRow>(
    (data as ConfigRow[]).map(r => [r.metric_key, r]),
  );

  const merged = DEFAULT_METRIC_CONFIG.map(def => {
    const row = rowsByKey.get(def.metric_key);
    if (!row) return def;
    return {
      ...def,
      is_visible:    row.is_visible,
      display_order: row.display_order,
      show_in_kpi:   row.show_in_kpi,
      show_in_table: row.show_in_table,
      show_in_chart: row.show_in_chart,
    };
  });

  return merged.sort((a, b) => a.display_order - b.display_order);
}

/** Upsert all configs for a client. Caller is responsible for passing the full set. */
export async function saveMetricConfigForClient(
  clientId: string,
  configs: MetricConfig[],
): Promise<void> {
  if (!isSupabaseConfigured()) return; // demo / mock mode — no-op
  const supabase = await getSupabase();

  const rows = configs.map(c => ({
    client_id:     clientId,
    metric_key:    c.metric_key,
    is_visible:    c.is_visible,
    display_order: c.display_order,
    show_in_kpi:   c.show_in_kpi,
    show_in_table: c.show_in_table,
    show_in_chart: c.show_in_chart,
    updated_at:    new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('cr_client_metric_config')
    .upsert(rows, { onConflict: 'client_id,metric_key' });

  if (error) throw new Error(error.message);
}
