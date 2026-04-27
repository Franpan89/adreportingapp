import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/utils/encrypt';

async function testMeta(fields: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const { access_token, account_id } = fields;
  if (!access_token) return { ok: false, message: 'Falta el Access Token' };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(access_token)}`,
    );
    const data = await res.json();
    if (data.error) return { ok: false, message: `Meta API: ${data.error.message}` };

    let extra = '';
    if (account_id) {
      const actId = account_id.startsWith('act_') ? account_id : `act_${account_id}`;
      const acctRes = await fetch(
        `https://graph.facebook.com/v21.0/${actId}?fields=id,name,account_status&access_token=${encodeURIComponent(access_token)}`,
      );
      const acctData = await acctRes.json();
      if (acctData.error) return { ok: false, message: `Cuenta publicitaria: ${acctData.error.message}` };
      extra = ` · Cuenta: ${acctData.name}`;
    }

    return { ok: true, message: `Conectado como ${data.name ?? data.id}${extra}` };
  } catch {
    return { ok: false, message: 'No se pudo contactar la API de Meta' };
  }
}

async function testGoogle(fields: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const { client_id, client_secret, refresh_token } = fields;
  if (!client_id || !client_secret || !refresh_token) {
    return { ok: false, message: 'Faltan Client ID, Client Secret o Refresh Token' };
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id,
        client_secret,
        refresh_token,
      }),
    });
    const data = await res.json();
    if (data.error) return { ok: false, message: `Google OAuth: ${data.error_description ?? data.error}` };
    return { ok: true, message: 'Credenciales OAuth de Google válidas' };
  } catch {
    return { ok: false, message: 'No se pudo contactar Google OAuth' };
  }
}

async function testTiktok(fields: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const { access_token, advertiser_id } = fields;
  if (!access_token) return { ok: false, message: 'Falta el Access Token' };

  try {
    const url = new URL('https://business-api.tiktok.com/open_api/v1.3/advertiser/info/');
    if (advertiser_id) url.searchParams.set('advertiser_ids', JSON.stringify([advertiser_id]));
    const res = await fetch(url.toString(), {
      headers: { 'Access-Token': access_token },
    });
    const data = await res.json();
    if (data.code !== 0) return { ok: false, message: `TikTok API: ${data.message ?? 'Error desconocido'}` };
    const name = data.data?.list?.[0]?.name ?? advertiser_id;
    return { ok: true, message: `Conectado · Cuenta: ${name}` };
  } catch {
    return { ok: false, message: 'No se pudo contactar la API de TikTok' };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json();
  const { channel, fields: rawFields } = body as { channel: string; fields?: Record<string, string> };

  if (!channel) return NextResponse.json({ error: 'channel requerido' }, { status: 400 });

  // Use provided fields, or fall back to saved (decrypted) credentials
  let fields: Record<string, string> = rawFields ?? {};
  if (!rawFields || Object.keys(rawFields).every(k => !rawFields[k])) {
    const { data } = await supabase
      .from('channel_credentials')
      .select('credentials_enc')
      .eq('client_id', clientId)
      .eq('channel', channel)
      .single();
    if (data?.credentials_enc) {
      try { fields = JSON.parse(decrypt(data.credentials_enc)); } catch { /* ignore */ }
    }
  }

  let result: { ok: boolean; message: string };
  if (channel === 'meta')        result = await testMeta(fields);
  else if (channel === 'google') result = await testGoogle(fields);
  else if (channel === 'tiktok') result = await testTiktok(fields);
  else return NextResponse.json({ error: 'Canal no soportado' }, { status: 400 });

  // Update sync_status in DB based on test result
  await supabase
    .from('channel_credentials')
    .update({ sync_status: result.ok ? 'success' : 'error', sync_error: result.ok ? null : result.message })
    .eq('client_id', clientId)
    .eq('channel', channel);

  return NextResponse.json(result);
}
