import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/utils/encrypt';
import { getMediaMeta, downloadMediaBytes } from '@/lib/connectors/whatsapp';

// GET — proxy WhatsApp media download (WA media URLs require Bearer auth + expire)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string; mediaId: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse('No autorizado', { status: 401 });

    const { clientId, mediaId } = await params;

    const { data: credRow } = await supabase
      .from('cr_channel_credentials')
      .select('credentials_enc')
      .eq('client_id', clientId)
      .eq('channel', 'whatsapp')
      .eq('is_active', true)
      .single();

    if (!credRow) return new NextResponse('Sin credenciales', { status: 400 });

    const creds = JSON.parse(decrypt(credRow.credentials_enc)) as {
      phone_number_id: string;
      access_token: string;
    };

    const meta  = await getMediaMeta(creds, mediaId);
    const bytes = await downloadMediaBytes(creds.access_token, meta.url);

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': meta.mime_type,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al descargar media';
    return new NextResponse(message, { status: 500 });
  }
}
