import Link from 'next/link';
import { DollarSign, Building2, AlertTriangle, Zap, Plus } from 'lucide-react';
import { StatsCard } from '@/components/superadmin/StatsCard';
import { PlanBadge, LicenseStatusBadge } from '@/components/superadmin/LicenseBadge';
import { SuperAdminBarChart } from '@/components/superadmin/SuperAdminBarChart';
import {
  getMRRAsync,
  getLicensesByStatusAsync,
  getExpiringLicensesAsync,
  getRecentLicensesAsync,
  getMonthlyLicenseCounts,
} from '@/lib/supabase/licenses';
import { formatCurrency } from '@/lib/utils/format';

export default async function SuperAdminDashboard() {
  const [mrr, active, expiring, trials, recent, monthly] = await Promise.all([
    getMRRAsync(),
    getLicensesByStatusAsync('active'),
    getExpiringLicensesAsync(30),
    getLicensesByStatusAsync('trial'),
    getRecentLicensesAsync(5),
    getMonthlyLicenseCounts(),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1F2937] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em' }}>
              Panel General
            </h1>
            <p className="text-sm text-white/40 mt-0.5">Vista global de AdPulse SaaS</p>
          </div>
          <Link
            href="/superadmin/licencias/nueva"
            className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium rounded-lg shadow-[2px_3px_0_rgba(0,0,0,0.3)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva licencia
          </Link>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="MRR Total"
            value={formatCurrency(mrr)}
            Icon={DollarSign}
            sublabel="ingresos mensuales recurrentes"
          />
          <StatsCard
            label="Agencias Activas"
            value={String(active.length)}
            Icon={Building2}
            sublabel="licencias en estado activo"
          />
          <StatsCard
            label="Por Vencer (30d)"
            value={String(expiring.length)}
            Icon={AlertTriangle}
            sublabel="licencias próximas a vencer"
            accent={expiring.length > 0 ? '#D97706' : '#7C3AED'}
          />
          <StatsCard
            label="Trials Activos"
            value={String(trials.length)}
            Icon={Zap}
            sublabel="agencias en período de prueba"
            accent="#6366F1"
          />
        </div>

        {/* Chart + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart */}
          <div className="lg:col-span-2 bg-[#1F2937] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Licencias Nuevas</h2>
                <p className="text-xs text-white/40 mt-0.5">Últimos 6 meses</p>
              </div>
            </div>
            <SuperAdminBarChart data={monthly} height={180} />
          </div>

          {/* Recent licenses */}
          <div className="bg-[#1F2937] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Últimas Licencias</h2>
              <Link href="/superadmin/licencias" className="text-xs text-[#7C3AED] hover:underline">
                Ver todas →
              </Link>
            </div>
            <div className="space-y-3">
              {recent.map(lic => (
                <Link
                  key={lic.id}
                  href={`/superadmin/licencias/${lic.id}`}
                  className="flex items-center justify-between hover:bg-white/5 rounded-lg px-2 py-2 -mx-2 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate group-hover:text-[#7C3AED] transition-colors">
                      {lic.agency_name}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {new Date(lic.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <PlanBadge planId={lic.plan_id} size="sm" />
                    <LicenseStatusBadge status={lic.status} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
