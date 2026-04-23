import Link from 'next/link';
import { ClientCard } from '@/components/admin/ClientCard';
import { Button } from '@/components/ui/Button';
import { MOCK_CLIENTS } from '@/lib/reports/mock';
import { Plus } from 'lucide-react';

const CLIENTS_WITH_STATS = MOCK_CLIENTS.map((c, i) => ({
  ...c,
  channels: [...c.channels],
  spend: [18760, 12340, 8920, 2160][i],
  roas: [5.12, 4.21, 3.87, 6.40][i],
}));

export default function ClientsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#111827] font-[Oswald] tracking-wide">Clientes</h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">{MOCK_CLIENTS.length} clientes gestionados</p>
          </div>
          <Link href="/admin/clients/new">
            <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Agregar cliente</Button>
          </Link>
        </div>
      </div>
      <div className="flex-1 px-6 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CLIENTS_WITH_STATS.map(client => (
            <ClientCard key={client.id} client={client as Parameters<typeof ClientCard>[0]['client']} />
          ))}
        </div>
      </div>
    </div>
  );
}
