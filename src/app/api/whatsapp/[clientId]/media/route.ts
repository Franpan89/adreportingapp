import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/utils/encrypt';
import { uploadMedia } from '@/lib/connectors/whatsapp';

// POST — upload a file to WhatsApp and return its media_id
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
      return NextResponse.json({ error: 'Sin credenciales WhatsApp' }, { status: 400 });
    }

    const creds = JSON.parse(decrypt(credRow.credentials_enc)) as {
      phone_number_id: string;
      access_token: string;
    };

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadMedia(creds, buffer, file.type, file.name);

    return NextResponse.json({ media_id: result.id, filename: file.name, mime_type: file.type });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al subir archivo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
