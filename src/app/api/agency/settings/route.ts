import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data } = await supabase
    .from('cr_agency_settings')
    .select('logo_url, agency_name, primary_color')
    .eq('admin_user_id', user.id)
    .single();

  return NextResponse.json({
    logo_url:      data?.logo_url      ?? null,
    agency_name:   data?.agency_name   ?? null,
    primary_color: data?.primary_color ?? '#00BD7D',
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json() as { logo_url?: string | null; agency_name?: string | null; primary_color?: string | null };

  const { error } = await supabase
    .from('cr_agency_settings')
    .upsert(
      { admin_user_id: user.id, ...body, updated_at: new Date().toISOString() },
      { onConflict: 'admin_user_id' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, ...body });
}
