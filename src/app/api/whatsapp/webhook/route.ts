import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/utils/encrypt';
import { markAsRead } from '@/lib/connectors/whatsapp';

// GET — Meta webhook verification challenge
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode !== 'subscribe') return new NextResponse('Forbidden', { status: 403 });

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken || token !== verifyToken) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return new NextResponse(challenge, { status: 200 });
}

// POST — receive events from Meta (messages + status updates)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as WhatsAppWebhookBody;
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();

    // Pre-fetch all active WhatsApp credentials once
    const { data: allCreds } = await supabase
      .from('cr_channel_credentials')
      .select('client_id, credentials_enc')
      .eq('channel', 'whatsapp')
      .eq('is_active', true);

    // Build a lookup map: phone_number_id → { clientId, creds }
    const phoneMap = new Map<string, { clientId: string; accessToken: string }>();
    for (const row of allCreds ?? []) {
      try {
        const creds = JSON.parse(decrypt(row.credentials_enc)) as { phone_number_id: string; access_token: string };
        phoneMap.set(creds.phone_number_id, { clientId: row.client_id, accessToken: creds.access_token });
      } catch { /* skip malformed */ }
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue;
        const value = change.value;
        const phoneNumberId = value.metadata?.phone_number_id;
        if (!phoneNumberId) continue;

        const client = phoneMap.get(phoneNumberId);
        if (!client) continue;

        for (const message of value.messages ?? []) {
          await processInboundMessage(supabase, client.clientId, phoneNumberId, message, value.contacts?.[0]);
          markAsRead(
            { phone_number_id: phoneNumberId, waba_id: '', access_token: client.accessToken },
            message.id,
          ).catch(() => { /* non-fatal */ });
        }

        for (const status of value.statuses ?? []) {
          await supabase
            .from('cr_whatsapp_messages')
            .update({ status: status.status })
            .eq('wamid', status.id);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[whatsapp webhook]', err);
    return NextResponse.json({ received: true }); // Always 200 so Meta doesn't retry
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processInboundMessage(supabase: any, clientId: string, phoneNumberId: string, message: WaMessage, contact?: WaContact) {
  const waId       = message.from;
  const displayName = contact?.profile?.name ?? waId;

  // Upsert contact
  const { data: contactRow } = await supabase
    .from('cr_whatsapp_contacts')
    .upsert(
      { client_id: clientId, wa_id: waId, display_name: displayName, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,wa_id' },
    )
    .select('id')
    .single();

  if (!contactRow) return;

  // Upsert conversation
  const { data: conv } = await supabase
    .from('cr_whatsapp_conversations')
    .upsert(
      { client_id: clientId, contact_id: contactRow.id, phone_number_id: phoneNumberId },
      { onConflict: 'client_id,contact_id,phone_number_id' },
    )
    .select('id, unread_count')
    .single();

  if (!conv) return;

  // Parse message payload
  const msgType = message.type;
  let body: string | null = null;
  let mediaId: string | null = null;
  let mediaMimeType: string | null = null;
  let mediaFilename: string | null = null;

  if (msgType === 'text') {
    body = message.text?.body ?? null;
  } else if (['image', 'document', 'video', 'audio', 'sticker'].includes(msgType)) {
    const media = (message as unknown as Record<string, { id?: string; mime_type?: string; filename?: string; caption?: string }>)[msgType];
    mediaId       = media?.id ?? null;
    mediaMimeType = media?.mime_type ?? null;
    mediaFilename = media?.filename ?? null;
    body          = media?.caption ?? null;
  } else if (msgType === 'location') {
    const loc = message.location;
    body = loc?.name ? `📍 ${loc.name}` : '📍 Ubicación compartida';
  }

  const supportedTypes = ['text', 'image', 'document', 'video', 'audio', 'sticker', 'location'];
  const storedType = supportedTypes.includes(msgType) ? msgType : 'unsupported';
  const waTimestamp = message.timestamp
    ? new Date(Number(message.timestamp) * 1000).toISOString()
    : new Date().toISOString();

  await supabase
    .from('cr_whatsapp_messages')
    .upsert(
      {
        conversation_id: conv.id,
        client_id: clientId,
        wamid: message.id,
        direction: 'inbound',
        msg_type: storedType,
        body,
        media_id: mediaId,
        media_mime_type: mediaMimeType,
        media_filename: mediaFilename,
        status: 'delivered',
        wa_timestamp: waTimestamp,
      },
      { onConflict: 'wamid' },
    );

  const lastText = body ?? (mediaId ? `[${msgType}]` : 'Mensaje');
  await supabase
    .from('cr_whatsapp_conversations')
    .update({
      last_message_at: waTimestamp,
      last_message_text: lastText,
      unread_count: (conv.unread_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conv.id);
}

// ── Types ──────────────────────────────────────────────────────────────────

interface WhatsAppWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: WaChangeValue;
    }>;
  }>;
}

interface WaChangeValue {
  messaging_product: string;
  metadata?: { display_phone_number: string; phone_number_id: string };
  contacts?: WaContact[];
  messages?: WaMessage[];
  statuses?: Array<{ id: string; status: string; timestamp: string; recipient_id: string }>;
}

interface WaContact {
  profile?: { name?: string };
  wa_id: string;
}

interface WaMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  location?: { latitude: number; longitude: number; name?: string };
}
