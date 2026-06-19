// WhatsApp Business Cloud API connector (Meta Graph API v21.0)
// Pure data-fetching module — no Supabase, no auth, no Next.js.

const WA_BASE = 'https://graph.facebook.com/v21.0';

export interface WhatsAppCreds {
  phone_number_id: string;
  waba_id?: string;
  access_token: string;
  webhook_verify_token?: string;
}

export type WaMediaType = 'image' | 'document' | 'video' | 'audio' | 'sticker';

interface WaSendResponse {
  messages: Array<{ id: string }>;
  contacts: Array<{ input: string; wa_id: string }>;
}

async function waFetch(url: string, token: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `WhatsApp API error ${res.status}`);
  }
  return res;
}

export async function sendTextMessage(
  creds: WhatsAppCreds,
  to: string,
  body: string,
): Promise<WaSendResponse> {
  const res = await waFetch(
    `${WA_BASE}/${creds.phone_number_id}/messages`,
    creds.access_token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body, preview_url: false },
      }),
    },
  );
  return res.json() as Promise<WaSendResponse>;
}

export async function sendMediaMessage(
  creds: WhatsAppCreds,
  to: string,
  type: WaMediaType,
  mediaId: string,
  caption?: string,
  filename?: string,
): Promise<WaSendResponse> {
  const mediaPayload: Record<string, unknown> = { id: mediaId };
  if (caption) mediaPayload.caption = caption;
  if (filename && type === 'document') mediaPayload.filename = filename;

  const res = await waFetch(
    `${WA_BASE}/${creds.phone_number_id}/messages`,
    creds.access_token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type,
        [type]: mediaPayload,
      }),
    },
  );
  return res.json() as Promise<WaSendResponse>;
}

export async function uploadMedia(
  creds: WhatsAppCreds,
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<{ id: string }> {
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', mimeType);
  form.append('file', new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);

  const res = await waFetch(
    `${WA_BASE}/${creds.phone_number_id}/media`,
    creds.access_token,
    { method: 'POST', body: form },
  );
  return res.json() as Promise<{ id: string }>;
}

export async function getMediaMeta(
  creds: WhatsAppCreds,
  mediaId: string,
): Promise<{ url: string; mime_type: string; file_size: number; id: string }> {
  const res = await waFetch(`${WA_BASE}/${mediaId}`, creds.access_token);
  return res.json() as Promise<{ url: string; mime_type: string; file_size: number; id: string }>;
}

export async function downloadMediaBytes(
  accessToken: string,
  url: string,
): Promise<ArrayBuffer> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`WhatsApp media download error ${res.status}`);
  return res.arrayBuffer();
}

export async function markAsRead(
  creds: WhatsAppCreds,
  messageId: string,
): Promise<void> {
  await fetch(`${WA_BASE}/${creds.phone_number_id}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  });
  // Non-fatal — mark-as-read failures don't throw
}
