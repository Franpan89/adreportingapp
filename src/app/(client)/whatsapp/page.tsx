import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase/auth';
import { getClientPortalUser } from '@/lib/supabase/client-portal';
import { createClient as createSupabase } from '@/lib/supabase/server';
import { WhatsAppInbox } from '@/app/(admin)/admin/whatsapp/_components/WhatsAppInbox';
import type { Client } from '@/types';

export default async function ClientWhatsAppPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const portal = await getClientPortalUser(user.id);
  if (!portal) redirect('/admin/dashboard');

  // Build a minimal Client object scoped to this client
  const supabase = await createSupabase();
  const { data } = await supabase
    .from('cr_clients')
    .select('id, name, slug, logo_url, timezone, is_active, created_at, business_type')
    .eq('id', portal.clientId)
    .single();

  if (!data) redirect('/dashboard');

  const clientObj: Client = {
    id:            data.id,
    name:          data.name,
    slug:          data.slug,
    logo_url:      data.logo_url ?? null,
    timezone:      data.timezone,
    is_active:     data.is_active,
    created_at:    data.created_at,
    business_type: data.business_type ?? null,
  };

  return <WhatsAppInbox clients={[clientObj]} />;
}
