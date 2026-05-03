import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/utils/encrypt';
import { getConversionActionTypes, getRevenueActionTypes } from '@/lib/utils/objectives';

// ─── Meta ─────────────────────────────────────────────────────────────────────

function sumActions(
  arr: { action_type: string; value: string }[] | undefined,
  types: string[],
): number {
  if (!arr) return 0;
  return arr
    .filter(a => types.includes(a.action_type))
    .reduce((s, a) => s + parseFloat(a.value ?? '0'), 0);
}

async function fetchAllMeta(url: string): Promise<unknown[]> {
  const results: unknown[] = [];
  let next: string | null = url;
  while (next) {
    const res = await fetch(next);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    if (data.error) throw new Error(`Meta API: ${data.error.message}`);
    results.push(...(data.data ?? []));
    next = data.paging?.next ?? null;
  }
  return results;
}

const MESSAGING_OPTIMIZATION_GOALS = new Set([
  'CONVERSATIONS', 'REPLY_MESSAGING', 'MESSAGING_APPOINTMENT_CONVERSION', 'MESSAGING_PURCHASE_CONVERSION',
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveObjectiveKey(campaign: any): string {
  const base: string = campaign.objective ?? '';
  if (base !== 'OUTCOME_ENGAGEMENT') return base;
  const adsets: any[] = campaign.adsets?.data ?? [];
  const isMessaging = adsets.some(
    a => MESSAGING_OPTIMIZATION_GOALS.has(a.optimization_goal ?? '') ||
         ['MESSENGER', 'WHATSAPP', 'INSTAGRAM_DIRECT'].includes(a.destination_type ?? ''),
  );
  return isMessaging ? 'OUTCOME_ENGAGEMENT_CONVERSATIONS' : base;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveMetaToken(supabase: any, userId: string, clientCreds: Record<string, string>): Promise<string> {
  if (clientCreds.access_token) return clientCreds.access_token;

  const { data } = await supabase
    .from('agency_meta_connections')
    .select('access_token_enc')
    .eq('admin_user_id', userId)
    .single();

  if (!data?.access_token_enc) {
    throw new Error(
      'Sin token de acceso. Configura el Conector Meta en Configuración o añade credenciales al cliente.',
    );
  }

  return decrypt(data.access_token_enc);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncMeta(supabase: any, userId: string, clientId: string, creds: Record<string, string>, since: string, until: string) {
  const account_id = creds.account_id;
  if (!account_id) throw new Error('Falta account_id en las credenciales del cliente');

  const access_token = await resolveMetaToken(supabase, userId, creds);

  const actId = account_id.startsWith('act_') ? account_id : `act_${account_id}`;
  const BASE = 'https://graph.facebook.com/v21.0';

  // 1. Fetch campaigns with adset optimization_goal to detect messaging campaigns
  const campParams = new URLSearchParams({
    fields: 'id,name,status,objective,adsets{optimization_goal,destination_type}',
    limit: '500',
    access_token,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metaCampaigns = (await fetchAllMeta(`${BASE}/${actId}/campaigns?${campParams}`)) as any[];
  console.log(`[sync:meta] campaigns fetched: ${metaCampaigns.length}`);

  if (metaCampaigns.length === 0) {
    return { ok: true, rows_upserted: 0, message: 'Sin campañas activas en la cuenta' };
  }

  // 2. Batch upsert campaigns — objective key is resolved from adset optimization_goal
  await supabase.from('cr_campaigns').upsert(
    metaCampaigns.map(c => ({
      client_id: clientId,
      channel: 'meta',
      external_id: String(c.id),
      name: c.name ?? 'Sin nombre',
      status: c.status ?? null,
      objective: resolveObjectiveKey(c),
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'client_id,channel,external_id' },
  );

  // 3. Build external_id → db_id map AND objective map
  const { data: dbCamps } = await supabase
    .from('cr_campaigns')
    .select('id, external_id, objective')
    .eq('client_id', clientId)
    .eq('channel', 'meta');

  const campMap = new Map<string, string>(
    (dbCamps ?? []).map((c: { id: string; external_id: string }) => [c.external_id, c.id]),
  );
  const campObjectiveMap = new Map<string, string>(
    (dbCamps ?? []).map((c: { external_id: string; objective: string }) => [c.external_id, c.objective ?? '']),
  );

  // 4. Fetch insights — campaign level, 1 row per day
  //    Note: "video_views" is NOT a valid Insights API field; use video_thruplay_watched_actions via actions
  const insightParams = new URLSearchParams({
    fields: 'campaign_id,impressions,clicks,spend,reach,actions,action_values',
    level: 'campaign',
    time_range: JSON.stringify({ since, until }),
    time_increment: '1',
    limit: '500',
    access_token,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insights = (await fetchAllMeta(`${BASE}/${actId}/insights?${insightParams}`)) as any[];
  console.log(`[sync:meta] insight rows fetched: ${insights.length}`);

  if (insights.length === 0) {
    return { ok: true, rows_upserted: 0, message: 'Sin datos en el rango de fechas seleccionado' };
  }

  // 5. Build daily_stats rows — use objective-specific action types per campaign
  const videoTypes = ['video_view', 'video_thruplay_watched_actions'];

  const statsRows = insights
    .map(row => {
      const extId    = String(row.campaign_id);
      const dbCampId = campMap.get(extId);
      if (!dbCampId) return null;

      const objective  = campObjectiveMap.get(extId) ?? '';
      const convTypes  = getConversionActionTypes(objective);
      const revenTypes = getRevenueActionTypes(objective);

      return {
        client_id: clientId,
        campaign_id: dbCampId,
        channel: 'meta',
        date: row.date_start,
        impressions:        parseInt(row.impressions ?? '0', 10) || 0,
        clicks:             parseInt(row.clicks ?? '0', 10) || 0,
        spend:              parseFloat(row.spend ?? '0') || 0,
        reach:              parseInt(row.reach ?? '0', 10) || 0,
        video_views:        sumActions(row.actions, videoTypes),
        conversions:        sumActions(row.actions, convTypes),
        conversions_value:  sumActions(row.action_values, revenTypes),
        link_clicks:        sumActions(row.actions, ['link_click', 'outbound_click']),
      };
    })
    .filter(Boolean);

  // 6. Batch upsert in chunks of 500
  for (let i = 0; i < statsRows.length; i += 500) {
    const { error } = await supabase
      .from('cr_daily_stats')
      .upsert(statsRows.slice(i, i + 500), { onConflict: 'campaign_id,date' });
    if (error) throw new Error(`Error guardando stats: ${error.message}`);
  }

  console.log(`[sync:meta] stats rows upserted: ${statsRows.length}`);
  return {
    ok: true,
    rows_upserted: statsRows.length,
    message: `${metaCampaigns.length} campañas, ${statsRows.length} registros diarios importados`,
  };
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> },
) {
  const { channel } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { clientId, since, until } = body as { clientId?: string; since?: string; until?: string };
  if (!clientId) return NextResponse.json({ error: 'clientId requerido' }, { status: 400 });

  const sinceDate = since ?? new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const untilDate = until ?? new Date().toISOString().slice(0, 10);

  // Load & decrypt credentials
  const { data: credRow } = await supabase
    .from('cr_channel_credentials')
    .select('credentials_enc')
    .eq('client_id', clientId)
    .eq('channel', channel)
    .eq('is_active', true)
    .single();

  if (!credRow?.credentials_enc) {
    return NextResponse.json({ error: `Sin credenciales guardadas para ${channel}` }, { status: 404 });
  }

  let fields: Record<string, string>;
  try {
    fields = JSON.parse(decrypt(credRow.credentials_enc));
  } catch {
    return NextResponse.json({ error: 'No se pudieron descifrar las credenciales' }, { status: 500 });
  }

  await supabase
    .from('cr_channel_credentials')
    .update({ sync_status: 'syncing' })
    .eq('client_id', clientId)
    .eq('channel', channel);

  try {
    let result: { ok: boolean; rows_upserted: number; message?: string };

    if (channel === 'meta') {
      result = await syncMeta(supabase, user.id, clientId, fields, sinceDate, untilDate);
    } else {
      result = { ok: false, rows_upserted: 0, message: `Sincronización para ${channel} aún no implementada` };
    }

    await supabase
      .from('cr_channel_credentials')
      .update({ sync_status: result.ok ? 'success' : 'error', last_synced_at: new Date().toISOString(), sync_error: null })
      .eq('client_id', clientId)
      .eq('channel', channel);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    await supabase
      .from('cr_channel_credentials')
      .update({ sync_status: 'error', sync_error: message })
      .eq('client_id', clientId)
      .eq('channel', channel);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
