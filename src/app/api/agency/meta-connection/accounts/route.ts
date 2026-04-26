import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/utils/encrypt';
import type { AdAccount } from '@/types';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: conn } = await supabase
    .from('agency_meta_connections')
    .select('access_token_enc')
    .eq('admin_user_id', user.id)
    .single();

  if (!conn) return NextResponse.json({ error: 'Meta no conectado' }, { status: 404 });

  let access_token: string;
  try {
    access_token = decrypt(conn.access_token_enc);
  } catch {
    return NextResponse.json({ error: 'No se pudo descifrar el token' }, { status: 500 });
  }

  const params = new URLSearchParams({
    fields: 'id,name,account_status,currency',
    limit: '200',
    access_token,
  });

  const res = await fetch(`https://graph.facebook.com/v21.0/me/adaccounts?${params}`);
  const json = await res.json();

  if (json.error) {
    return NextResponse.json({ error: json.error.message }, { status: 400 });
  }

  const accounts: AdAccount[] = (json.data ?? [])
    .filter((a: AdAccount) => a.account_status === 1)
    .map((a: AdAccount) => ({
      id: a.id,
      name: a.name,
      account_status: a.account_status,
      currency: a.currency,
    }));

  return NextResponse.json({ accounts });
}
