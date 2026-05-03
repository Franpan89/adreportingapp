import { NextRequest, NextResponse } from 'next/server';
import { getClients, createClient } from '@/lib/supabase/clients';
import { createClient as createSupabase } from '@/lib/supabase/server';
import { encrypt } from '@/lib/utils/encrypt';

export async function GET() {
  const supabase = await createSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const clients = await getClients();
  return NextResponse.json({ clients });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { name, slug, timezone, meta_account_id } = body as {
      name: string;
      slug: string;
      timezone?: string;
      meta_account_id?: string;
    };

    if (!name || !slug) {
      return NextResponse.json({ error: 'name y slug son requeridos' }, { status: 400 });
    }

    const client = await createClient({ name, slug, timezone });

    if (meta_account_id) {
      let credentials_enc: string;
      try {
        credentials_enc = encrypt(JSON.stringify({ account_id: meta_account_id }));
      } catch (e) {
        console.error('[clients] failed to encrypt meta credentials:', e);
        return NextResponse.json({ client }, { status: 201 });
      }

      await supabase
        .from('cr_channel_credentials')
        .upsert(
          {
            client_id: client.id,
            channel: 'meta',
            credentials_enc,
            is_active: true,
            sync_status: 'idle',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'client_id,channel' },
        );
    }

    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
