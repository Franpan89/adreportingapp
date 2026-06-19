import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string; conversationId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { clientId, conversationId } = await params;

  const { data, error } = await supabase
    .from('cr_whatsapp_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('client_id', clientId)
    .order('wa_timestamp', { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Reset unread count when messages are viewed
  await supabase
    .from('cr_whatsapp_conversations')
    .update({ unread_count: 0 })
    .eq('id', conversationId);

  return NextResponse.json({ messages: data });
}
