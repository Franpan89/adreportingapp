import Link from 'next/link';
import { PlanBadge, LicenseStatusBadge } from '@/components/superadmin/LicenseBadge';
import type { License } from '@/types';
import { getPlanById } from '@/lib/data/licenses';

interface LicenseTableProps {
  licenses: License[];
}

export function LicenseTable({ licenses }: LicenseTableProps) {
  if (licenses.length === 0) {
    return (
      <div className="bg-[#1F2937] border border-white/10 rounded-xl py-16 text-center">
        <p className="text-white/55 text-sm">No hay licencias en esta categoría</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1F2937] border border-white/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-[#0D1117]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/55 uppercase tracking-wider">
                Agencia
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/55 uppercase tracking-wider">
                Plan
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/55 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/55 uppercase tracking-wider">
                Clientes
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/55 uppercase tracking-wider">
                Vencimiento
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {licenses.map((lic, i) => {
              const plan = getPlanById(lic.plan_id);
              const maxClients = plan.max_clients === null ? '∞' : String(plan.max_clients);
              return (
                <tr
                  key={lic.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white text-sm">{lic.agency_name}</p>
                    <p className="text-[11px] text-white/55 mt-0.5">{lic.agency_email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <PlanBadge planId={lic.plan_id} />
                  </td>
                  <td className="px-4 py-4">
                    <LicenseStatusBadge status={lic.status} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-white/70">
                      {lic.clients_count}
                      <span className="text-white/30"> / {maxClients}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-white/60">
                      {lic.expires_at
                        ? new Date(lic.expires_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                        : <span className="text-white/30 italic">Sin límite</span>
                      }
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/superadmin/licencias/${lic.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white/70 bg-white/5 hover:bg-[#7C3AED]/20 hover:text-[#7C3AED] border border-white/10 hover:border-[#7C3AED]/30 rounded-lg transition-colors"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
