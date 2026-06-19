import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/utils/encrypt';
import { sendTextMessage, sendMediaMessage, type WaMediaType } from '@/lib/connectors/whatsapp';

interface SendBody {
  conversationId: string;
  to: string;
  type: 'text' | WaMediaType;
  text?: string;
  mediaId?: string;
  caption?: string;
  filename?: string;
  mimeType?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { clientId } = await params;

    const { data: credRow } = await supabase
      .from('cr_channel_credentials')
      .select('credentials_enc')
      .eq('client_id', clientId)
      .eq('channel', 'whatsapp')
      .eq('is_active', true)
      .single();

    if (!credRow) {
      return NextResponse.json({ error: 'Sin credenciales WhatsApp configuradas para este cliente' }, { status: 400 });
    }

    const creds = JSON.parse(decrypt(credRow.credentials_enc)) as {
      phone_number_id: string;
      waba_id: string;
      access_token: string;
    };

    const body = await request.json() as SendBody;

    let wamid: string;
    if (body.type === 'text') {
      if (!body.text?.trim()) {
        return NextResponse.json({ error: 'Falta el texto del mensaje' }, { status: 400 });
      }
      const result = await sendTextMessage(creds, body.to, body.text.trim());
      wamid = result.messages[0].id;
    } else {
      if (!body.mediaId) {
        return NextResponse.json({ error: 'Falta el mediaId' }, { status: 400 });
      }
      const result = await sendMediaMessage(creds, body.to, body.type as WaMediaType, body.mediaId, body.caption, body.filename);
      wamid = result.messages[0].id;
    }

    const now = new Date().toISOString();
    const storedBody = body.type === 'text' ? (body.text ?? null) : (body.caption ?? null);

    const { data: msg } = await supabase
      .from('cr_whatsapp_messages')
      .insert({
        conversation_id: body.conversationId,
        client_id: clientId,
        wamid,
        direction: 'outbound',
        msg_type: body.type,
        body: storedBody,
        media_id: body.type !== 'text' ? body.mediaId : null,
        media_mime_type: body.mimeType ?? null,
        media_filename: body.filename ?? null,
        status: 'sent',
        wa_timestamp: now,
      })
      .select()
      .single();

    await supabase
      .from('cr_whatsapp_conversations')
      .update({
        last_message_at: now,
        last_message_text: storedBody ?? `[${body.type}]`,
        updated_at: now,
      })
      .eq('id', body.conversationId);

    return NextResponse.json({ message: msg });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
