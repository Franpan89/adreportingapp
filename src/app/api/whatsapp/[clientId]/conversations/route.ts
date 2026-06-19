import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { clientId } = await params;

  const { data, error } = await supabase
    .from('cr_whatsapp_conversations')
    .select(`
      id, phone_number_id, last_message_at, last_message_text, unread_count, updated_at,
      cr_whatsapp_contacts ( id, wa_id, display_name )
    `)
    .eq('client_id', clientId)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversations: data });
}
