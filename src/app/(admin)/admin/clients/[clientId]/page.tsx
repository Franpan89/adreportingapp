import Link from 'next/link';
import { ArrowLeft, Settings2, Key, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { MOCK_CLIENTS } from '@/lib/reports/mock';
import type { Channel } from '@/types';

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function AdminClientDetailPage({ params }: PageProps) {
  const { clientId } = await params;
  const client = MOCK_CLIENTS.find(c => c.id === clientId) ?? MOCK_CLIENTS[0];

  return (
    <div className="flex-1 flex flex-col">
      {/* Breadcrumb header */}
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/admin/clients" className="flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#111827]">
              <ArrowLeft className="w-3.5 h-3.5" /> Clientes
            </Link>
            <span className="text-[#E5E7EB]">/</span>
            <span className="text-sm font-medium text-[#111827]">{client.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/clients/${clientId}/reportes`}>
              <Button variant="outline" size="sm" icon={<FileText className="w-3.5 h-3.5" />}>
                Reportes
              </Button>
            </Link>
            <Link href={`/admin/clients/${clientId}/metrics`}>
              <Button variant="outline" size="sm" icon={<Settings2 className="w-3.5 h-3.5" />}>
                Config. métricas
              </Button>
            </Link>
            <Link href={`/admin/clients/${clientId}/credentials`}>
              <Button variant="outline" size="sm" icon={<Key className="w-3.5 h-3.5" />}>
                Credenciales
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Reuse the full dashboard shell — admin has sync access */}
      <DashboardShell
        clientId={clientId}
        clientName={client.name}
        availableChannels={[...(client.channels ?? [])] as Channel[]}
        isAdmin={true}
      />
    </div>
  );
}
