import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/auth';
import { encrypt, decrypt } from '@/lib/utils/encrypt';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = await createClient();
  const { data } = await supabase
    .from('agency_meta_connections')
    .select('id, connected_at, verified_at, access_token_enc')
    .eq('admin_user_id', user.id)
    .single();

  if (!data) return NextResponse.json({ connected: false });

  let tokenPreview = '';
  try {
    const token = decrypt(data.access_token_enc);
    tokenPreview = token.slice(0, 6) + '…' + token.slice(-4);
  } catch {
    tokenPreview = '••••';
  }

  return NextResponse.json({
    connected: true,
    connected_at: data.connected_at,
    verified_at: data.verified_at,
    token_preview: tokenPreview,
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const supabase = await createClient();

  const body = await request.json().catch(() => ({}));
  const { access_token } = body as { access_token?: string };
  if (!access_token?.trim()) {
    return NextResponse.json({ error: 'access_token requerido' }, { status: 400 });
  }

  // Verify the token works before saving
  const verifyRes = await fetch(
    `https://graph.facebook.com/v21.0/me/adaccounts?fields=id&limit=1&access_token=${encodeURIComponent(access_token)}`,
  );
  const verifyData = await verifyRes.json();
  if (verifyData.error) {
    return NextResponse.json(
      { error: `Token inválido: ${verifyData.error.message}` },
      { status: 400 },
    );
  }

  let access_token_enc: string;
  try {
    access_token_enc = encrypt(access_token);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error de cifrado' }, { status: 500 });
  }

  const { error } = await supabase
    .from('agency_meta_connections')
    .upsert(
      {
        admin_user_id: user.id,
        access_token_enc,
        connected_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
      },
      { onConflict: 'admin_user_id' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const supabase = await createClient();

  await supabase
    .from('agency_meta_connections')
    .delete()
    .eq('admin_user_id', user.id);

  return NextResponse.json({ ok: true });
}
