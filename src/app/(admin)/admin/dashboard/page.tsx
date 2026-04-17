import Link from 'next/link';
import { ClientCard } from '@/components/admin/ClientCard';
import { Button } from '@/components/ui/Button';
import { MOCK_CLIENTS } from '@/lib/reports/mock';
import { Plus, RefreshCw, Users, TrendingUp, DollarSign, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

// Mock aggregate stats across all clients
const AGGREGATE = {
  totalSpend: 42180,
  totalRoas: 4.82,
  activeClients: 3,
  activeChannels: 7,
};

const CLIENTS_WITH_STATS = MOCK_CLIENTS.map((c, i) => ({
  ...c,
  channels: [...c.channels],
  spend: [18760, 12340, 8920, 2160][i],
  roas: [5.12, 4.21, 3.87, 6.40][i],
}));

export default function AdminDashboardPage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#111827] font-[Oswald] tracking-wide">Agency Overview</h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">All clients · Last 30 days</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Sync all
            </Button>
            <Link href="/admin/clients/new">
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Add client
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 space-y-6">
        {/* Aggregate KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Spend', value: formatCurrency(AGGREGATE.totalSpend), icon: DollarSign, color: '#00BD7D' },
            { label: 'Avg. ROAS',   value: `${AGGREGATE.totalRoas.toFixed(2)}x`, icon: TrendingUp,  color: '#1877F2' },
            { label: 'Active Clients', value: String(AGGREGATE.activeClients), icon: Users, color: '#D97706' },
            { label: 'Active Channels', value: String(AGGREGATE.activeChannels), icon: Zap,  color: '#16A34A' },
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

        {/* Clients grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#111827]">Clients</h2>
            <Link href="/admin/clients" className="text-xs text-[#00BD7D] hover:underline">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {CLIENTS_WITH_STATS.map(client => (
              <ClientCard key={client.id} client={client as Parameters<typeof ClientCard>[0]['client']} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
