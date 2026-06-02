import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/supabase/auth';
import { resolveAgencyOwnerId } from '@/lib/supabase/team';
import { decrypt } from '@/lib/utils/encrypt';
import { fetchMetaAdAccounts } from '@/lib/connectors/meta';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const supabase = await createClient();

  // Share the agency owner's connection with team members.
  const ownerId = await resolveAgencyOwnerId(supabase, user.id);
  const { data: conn } = await createAdminClient()
    .from('agency_meta_connections')
    .select('access_token_enc')
    .eq('admin_user_id', ownerId)
    .maybeSingle();

  if (!conn) return NextResponse.json({ error: 'Meta no conectado' }, { status: 404 });

  let access_token: string;
  try {
    access_token = decrypt(conn.access_token_enc);
  } catch {
    return NextResponse.json({ error: 'No se pudo descifrar el token' }, { status: 500 });
  }

  try {
    const accounts = await fetchMetaAdAccounts(access_token);
    return NextResponse.json({ accounts });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
