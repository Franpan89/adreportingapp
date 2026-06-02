import Link from 'next/link';
import { ClientCard } from '@/components/admin/ClientCard';
import { Button } from '@/components/ui/Button';
import { getClients } from '@/lib/supabase/clients';
import { Plus, RefreshCw, Users, TrendingUp, DollarSign, Zap } from 'lucide-react';

export default async function AdminDashboardPage() {
  const clients = await getClients();
  const activeClients = clients.filter(c => c.is_active);
  const activeChannels = new Set(clients.flatMap(c => c.channels)).size;

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#111827] font-[Roboto] tracking-wide">Resumen de Agencia</h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">Todos los clientes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Sincronizar
            </Button>
            <Link href="/admin/clients/new">
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Agregar cliente
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Inversión Total',   value: '—',                         icon: DollarSign, color: '#00BD7D' },
            { label: 'ROAS Prom.',        value: '—',                         icon: TrendingUp,  color: '#1877F2' },
            { label: 'Clientes Activos',  value: String(activeClients.length), icon: Users,       color: '#D97706' },
            { label: 'Canales Activos',   value: String(activeChannels),       icon: Zap,         color: '#16A34A' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-[var(--shadow-perspective-sm)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-perspective-md)] transition-all duration-150">
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shadow-[2px_3px_0px_rgba(0,0,0,0.12)]"
                  style={{ background: stat.color + '20' }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-[#111827]">{stat.value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#111827]">Clientes</h2>
            <Link href="/admin/clients" className="text-xs text-[#00BD7D] hover:underline">
              Ver todos →
            </Link>
          </div>

          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 bg-white border border-[#E5E7EB] rounded-xl text-center">
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
    </div>
  );
}
