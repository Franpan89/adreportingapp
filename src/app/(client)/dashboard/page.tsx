import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase/auth';
import { getClientPortalUser } from '@/lib/supabase/client-portal';
import { getClientById } from '@/lib/supabase/clients';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import type { Channel } from '@/types';

export default async function ClientDashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const portal = await getClientPortalUser(user.id);
  if (!portal) redirect('/admin/dashboard');

  const client = await getClientById(portal.clientId);
  if (!client) redirect('/login');

  return (
    <DashboardShell
      clientId={portal.clientId}
      clientName={client.name}
      availableChannels={(client.channels ?? []) as Channel[]}
      businessType={client.business_type}
      isAdmin={false}
    />
  );
}
