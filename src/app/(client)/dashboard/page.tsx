import { DashboardShell } from '@/components/dashboard/DashboardShell';
import type { Channel } from '@/types';

export default function ClientDashboardPage() {
  return (
    <DashboardShell
      clientId="client-1"
      clientName="Luxe Cosmetics"
      availableChannels={['meta', 'google', 'tiktok'] as Channel[]}
      isAdmin={false}
    />
  );
}
