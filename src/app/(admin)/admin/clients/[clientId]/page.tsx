import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Settings2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { DeleteClientButton } from './_components/DeleteClientButton';
import { BusinessTypeSelect } from './_components/BusinessTypeSelect';
import { ClientLogoEdit } from './_components/ClientLogoEdit';
import { getClientById } from '@/lib/supabase/clients';
import type { Channel } from '@/types';

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function AdminClientDetailPage({ params }: PageProps) {
  const { clientId } = await params;
  const client = await getClientById(clientId);

  if (!client) notFound();

  return (
    <div className="flex-1 flex flex-col">
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
            <BusinessTypeSelect clientId={clientId} initial={client.business_type} />
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
<DeleteClientButton clientId={clientId} clientName={client.name} />
          </div>
        </div>
      </div>

      {/* Logo edit panel — collapsed by default, admin only */}
      <details className="border-b border-[#F3F4F6] bg-white group">
        <summary className="px-6 py-2 text-xs text-[#9CA3AF] cursor-pointer hover:text-[#374151] list-none flex items-center gap-1.5 select-none w-fit">
          <span className="group-open:rotate-90 transition-transform inline-block">›</span>
          Logo del cliente
        </summary>
        <div className="px-6 pb-4 pt-1">
          <ClientLogoEdit clientId={clientId} initialUrl={client.logo_url} />
        </div>
      </details>

      <DashboardShell
        clientId={clientId}
        clientName={client.name}
        availableChannels={client.channels as Channel[]}
        businessType={client.business_type}
        isAdmin={true}
      />
    </div>
  );
}
