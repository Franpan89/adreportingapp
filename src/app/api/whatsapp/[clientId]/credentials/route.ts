import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@/lib/utils/encrypt';

// GET — check if WhatsApp is configured for a client (returns shape without secrets)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { clientId } = await params;

  const { data } = await supabase
    .from('cr_channel_credentials')
    .select('id, is_active, credentials_enc')
    .eq('client_id', clientId)
    .eq('channel', 'whatsapp')
    .single();

  if (!data) return NextResponse.json({ configured: false });

  let phoneNumberId = '';
  let wabaId = '';
  try {
    const creds = JSON.parse(decrypt(data.credentials_enc)) as {
      phone_number_id?: string;
      waba_id?: string;
    };
    phoneNumberId = creds.phone_number_id ?? '';
    wabaId        = creds.waba_id ?? '';
  } catch { /* ignore */ }

  return NextResponse.json({
    configured: true,
    is_active: data.is_active,
    phone_number_id: phoneNumberId,
    waba_id: wabaId,
  });
}

// PUT — save (upsert) WhatsApp credentials for a client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { clientId } = await params;

    const body = await request.json() as {
      phone_number_id: string;
      waba_id: string;
      access_token: string;
      webhook_verify_token?: string;
    };

    if (!body.phone_number_id || !body.waba_id || !body.access_token) {
      return NextResponse.json({ error: 'phone_number_id, waba_id y access_token son requeridos' }, { status: 400 });
    }

    const credentials_enc = encrypt(JSON.stringify({
      phone_number_id:     body.phone_number_id,
      waba_id:             body.waba_id,
      access_token:        body.access_token,
      webhook_verify_token: body.webhook_verify_token ?? '',
    }));

    const { error } = await supabase
      .from('cr_channel_credentials')
      .upsert(
        {
          client_id:        clientId,
          channel:          'whatsapp',
          credentials_enc,
          is_active:        true,
          sync_status:      'idle',
          updated_at:       new Date().toISOString(),
        },
        { onConflict: 'client_id,channel' },
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
