import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Building2, Mail, Calendar, FileText, Users } from 'lucide-react';
import { getLicenseById, PLANS } from '@/lib/supabase/licenses';
import { getPlanById } from '@/lib/data/licenses';
import { LicenseStatusBadge, PlanBadge } from '@/components/superadmin/LicenseBadge';
import { LicenseActions } from './_components/LicenseActions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LicenseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const license = await getLicenseById(id);

  if (!license) notFound();

  const plan = getPlanById(license.plan_id);
  const maxClients = plan.max_clients === null ? '∞' : String(plan.max_clients);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1F2937] px-6 py-4">
        <Link
          href="/superadmin/licencias"
          className="flex items-center gap-1.5 text-sm text-white/55 hover:text-white mb-2 w-fit transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a licencias
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-xl font-bold text-white"
                style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em' }}
              >
                {license.agency_name}
              </h1>
              <LicenseStatusBadge status={license.status} />
            </div>
            <p className="text-sm text-white/55 mt-0.5">{license.agency_email}</p>
          </div>
          <PlanBadge planId={license.plan_id} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">

          {/* LEFT — 2/3 */}
          <div className="lg:col-span-2 space-y-5">

            {/* Agency details */}
            <div className="bg-[#1F2937] border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Información de la agencia</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailRow icon={<Building2 className="w-4 h-4" />} label="Agencia" value={license.agency_name} />
                <DetailRow icon={<Mail className="w-4 h-4" />} label="Email admin" value={license.agency_email} />
                <DetailRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Alta"
                  value={new Date(license.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                />
                <DetailRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Vencimiento"
                  value={
                    license.expires_at
                      ? new Date(license.expires_at).toLocaleDateString('es-MX', {
                          day: '2-digit', month: 'long', year: 'numeric',
                        })
                      : 'Sin límite'
                  }
                />
                <DetailRow
                  icon={<Users className="w-4 h-4" />}
                  label="Clientes"
                  value={`${license.clients_count} / ${maxClients}`}
                />
                {license.notes && (
                  <DetailRow
                    icon={<FileText className="w-4 h-4" />}
                    label="Notas"
                    value={license.notes}
                    fullWidth
                  />
                )}
              </div>
            </div>

            {/* Plan info */}
            <div className="bg-[#1F2937] border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Plan actual</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLANS.map(p => {
                  const isActive = p.id === license.plan_id;
                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl p-4 border transition-colors ${
                        isActive
                          ? 'border-[#7C3AED]/60 bg-[#7C3AED]/10'
                          : 'border-white/5 bg-[#111827] opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ color: p.color, background: p.color + '20' }}
                        >
                          {p.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full font-semibold">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-white">${p.price_monthly}<span className="text-xs text-white/55 font-normal">/mes</span></p>
                      <ul className="mt-2 space-y-1">
                        {p.features.map(f => (
                          <li key={f} className="text-[11px] text-white/50 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-white/30 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-white/30 mt-3">
                Para cambiar de plan, revoca esta licencia y crea una nueva con el plan deseado.
              </p>
            </div>
          </div>

          {/* RIGHT — 1/3 */}
          <div className="lg:col-span-1 space-y-5">
            <LicenseActions
              licenseId={license.id}
              initialStatus={license.status}
              agencyName={license.agency_name}
            />

            {/* Meta info */}
            <div className="bg-[#1F2937] border border-white/10 rounded-xl p-5 space-y-3">
              <p className="text-xs font-medium text-white/55 uppercase tracking-wider">Metadata</p>
              <MetaRow label="ID licencia" value={license.id} mono />
              <MetaRow label="ID agencia" value={license.agency_id} mono />
              {license.activated_at && (
                <MetaRow
                  label="Activada"
                  value={new Date(license.activated_at).toLocaleDateString('es-MX', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────── */
function DetailRow({
  icon, label, value, fullWidth = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <div className="flex items-center gap-1.5 text-white/55 mb-1">
        <span className="w-4 h-4">{icon}</span>
        <p className="text-[10px] font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm text-white pl-5">{value}</p>
    </div>
  );
}

function MetaRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-white/30 mb-0.5">{label}</p>
      <p className={`text-xs text-white/60 break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
