import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMetricConfigForClient, saveMetricConfigForClient } from '@/lib/supabase/metric-config';
import type { MetricConfig } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const config = await getMetricConfigForClient(clientId);
  return NextResponse.json({ config });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json().catch(() => null) as { config?: unknown } | null;
  if (!body || !Array.isArray(body.config)) {
    return NextResponse.json({ error: 'Body debe contener un array `config`' }, { status: 400 });
  }

  // Minimal shape validation — we trust the catalog of metric keys, but reject
  // arrays that don't carry the required fields.
  const required: (keyof MetricConfig)[] = [
    'metric_key', 'label', 'unit',
    'is_visible', 'display_order',
    'show_in_kpi', 'show_in_table', 'show_in_chart',
  ];
  for (const item of body.config) {
    if (!item || typeof item !== 'object') {
      return NextResponse.json({ error: 'Item de config inválido' }, { status: 400 });
    }
    for (const f of required) {
      if (!(f in (item as Record<string, unknown>))) {
        return NextResponse.json({ error: `Falta campo ${String(f)}` }, { status: 400 });
      }
    }
  }

  try {
    await saveMetricConfigForClient(clientId, body.config as MetricConfig[]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
