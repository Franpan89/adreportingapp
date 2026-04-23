import Link from 'next/link';
import { Building2, Users, ExternalLink, Plus } from 'lucide-react';
import { MOCK_LICENSES, getPlanById } from '@/lib/data/licenses';
import { PlanBadge, LicenseStatusBadge } from '@/components/superadmin/LicenseBadge';

export default function AgenciasPage() {
  const agencies = MOCK_LICENSES;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1F2937] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-bold text-white"
              style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em' }}
            >
              Agencias
            </h1>
            <p className="text-sm text-white/40 mt-0.5">{agencies.length} agencias registradas</p>
          </div>
          <Link
            href="/superadmin/licencias/nueva"
            className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium rounded-lg shadow-[2px_3px_0_rgba(0,0,0,0.3)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva agencia
          </Link>
        </div>
      </div>

      <div className="flex-1 px-6 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agencies.map(agency => {
            const plan = getPlanById(agency.plan_id);
            const maxClients = plan.max_clients === null ? '∞' : String(plan.max_clients);
            const usagePct = plan.max_clients === null
              ? null
              : Math.round((agency.clients_count / plan.max_clients) * 100);

            return (
              <div
                key={agency.id}
                className="bg-[#1F2937] border border-white/10 rounded-xl p-5 flex flex-col gap-4 hover:border-white/20 transition-colors"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  <LicenseStatusBadge status={agency.status} />
                </div>

                {/* Agency name + email */}
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{agency.agency_name}</p>
                  <p className="text-[11px] text-white/40 mt-0.5 truncate">{agency.agency_email}</p>
                </div>

                {/* Plan badge */}
                <PlanBadge planId={agency.plan_id} />

                {/* Client usage */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-white/40">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-xs">Clientes</span>
                    </div>
                    <span className="text-xs text-white/60">
                      {agency.clients_count}
                      <span className="text-white/30"> / {maxClients}</span>
                    </span>
                  </div>
                  {usagePct !== null && (
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(usagePct, 100)}%`,
                          background: usagePct >= 90 ? '#DC2626' : usagePct >= 70 ? '#D97706' : '#7C3AED',
                        }}
                      />
                    </div>
                  )}
                  {usagePct === null && (
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-[#7C3AED]/30 rounded-full" />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-1 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-white/30">
                    Desde {new Date(agency.created_at).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                  </span>
                  <Link
                    href={`/superadmin/licencias/${agency.id}`}
                    className="flex items-center gap-1 text-xs text-white/40 hover:text-[#7C3AED] transition-colors"
                  >
                    Ver licencia
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {agencies.length === 0 && (
          <div className="bg-[#1F2937] border border-white/10 rounded-xl py-20 text-center">
            <Building2 className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No hay agencias registradas</p>
            <Link
              href="/superadmin/licencias/nueva"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear primera licencia
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
