import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@/lib/utils/encrypt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;
  const channel = request.nextUrl.searchParams.get('channel');
  if (!channel) return NextResponse.json({ error: 'channel requerido' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data, error } = await supabase
    .from('channel_credentials')
    .select('credentials_enc, sync_status, last_synced_at, is_active')
    .eq('client_id', clientId)
    .eq('channel', channel)
    .single();

  if (error || !data) return NextResponse.json({ fields: {}, status: null });

  let fields: Record<string, string> = {};
  try {
    fields = JSON.parse(decrypt(data.credentials_enc));
  } catch {
    fields = {};
  }

  return NextResponse.json({
    fields,
    status: data.sync_status ?? 'idle',
    last_synced_at: data.last_synced_at,
    is_active: data.is_active,
  });
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
  const { channel, fields } = body as { channel: string; fields: Record<string, string> };

  if (!channel || !fields) {
    return NextResponse.json({ error: 'channel y fields son requeridos' }, { status: 400 });
  }

  let credentials_enc: string;
  try {
    credentials_enc = encrypt(JSON.stringify(fields));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de cifrado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { error } = await supabase
    .from('channel_credentials')
    .upsert(
      { client_id: clientId, channel, credentials_enc, is_active: true, sync_status: 'idle', updated_at: new Date().toISOString() },
      { onConflict: 'client_id,channel' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
