import Link from 'next/link';
import { ClientCard } from '@/components/admin/ClientCard';
import { Button } from '@/components/ui/Button';
import { getClients } from '@/lib/supabase/clients';
import { Plus } from 'lucide-react';

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#111827] font-[Oswald] tracking-wide">Clientes</h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">{clients.length} clientes gestionados</p>
          </div>
          <Link href="/admin/clients/new">
            <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Agregar cliente</Button>
          </Link>
        </div>
      </div>
      <div className="flex-1 px-6 py-5">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-[#6B7280] text-sm mb-2">No hay clientes aún.</p>
            <Link href="/admin/clients/new">
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Agregar primer cliente</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {clients.map(client => (
              <ClientCard key={client.id} client={client as Parameters<typeof ClientCard>[0]['client']} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
