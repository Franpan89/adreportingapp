import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import type { Channel } from '@/types';

export default async function ClientDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: clientUser } = await supabase
    .from('cr_client_users')
    .select('client_id, cr_clients(name, cr_channel_credentials(channel))')
    .eq('user_id', user.id)
    .single();

  if (!clientUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-10">
        <div>
          <p className="text-[#374151] font-semibold mb-1">Sin cliente asignado</p>
          <p className="text-sm text-[#9CA3AF]">Tu cuenta no está vinculada a ningún cliente todavía. Contacta a tu agencia.</p>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientData = clientUser.cr_clients as any;
  const clientName: string = clientData?.name ?? 'Dashboard';
  const channels: Channel[] = (clientData?.cr_channel_credentials ?? []).map((c: any) => c.channel as Channel);

  return (
    <DashboardShell
      clientId={clientUser.client_id}
      clientName={clientName}
      availableChannels={channels.length > 0 ? channels : ['meta', 'google', 'tiktok']}
      isAdmin={false}
    />
  );
}
