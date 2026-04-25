'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Copy, Check, X } from 'lucide-react';
import { PlanCard } from '@/components/superadmin/PlanCard';
import { PLANS } from '@/lib/data/licenses';
import type { PlanId, License } from '@/types';

/* ── Password generator ─────────────────────────────── */
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const inputCls = 'w-full bg-[#111827] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-colors';
const labelCls = 'block text-xs font-medium text-white/60 mb-1.5';

export default function NuevaLicenciaPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    agency_name: '',
    agency_email: '',
    temp_password: '',
    plan_id: '' as PlanId | '',
    expires_at: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLicense, setCreatedLicense] = useState<License | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setForm(f => ({ ...f, temp_password: generatePassword() }));
  }, []);

  function regeneratePassword() {
    setForm(f => ({ ...f, temp_password: generatePassword() }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.plan_id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_name:   form.agency_name,
          agency_email:  form.agency_email,
          plan_id:       form.plan_id,
          temp_password: form.temp_password,
          expires_at:    form.expires_at || null,
          notes:         form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al crear licencia');
      setCreatedLicense(data.license as License);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!createdLicense) return;
    const text = `AdPulse — Credenciales de acceso
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agencia:    ${createdLicense.agency_name}
Email:      ${createdLicense.agency_email}
Contraseña: ${createdLicense.temp_password}
Plan:       ${createdLicense.plan_id.toUpperCase()}
URL:        https://adpulse.com/login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const isComplete = form.agency_name && form.agency_email && form.plan_id;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1F2937] px-6 py-4">
        <Link href="/superadmin/licencias" className="flex items-center gap-1.5 text-sm text-white/55 hover:text-white mb-2 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a licencias
        </Link>
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em' }}>
          Nueva Licencia
        </h1>
        <p className="text-sm text-white/55 mt-0.5">Crea una cuenta de agencia y asigna un plan</p>
      </div>

      <div className="flex-1 px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
          {/* Form — 2/3 */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#fee2e2] border border-[#DC2626]/20 rounded-lg text-sm text-[#DC2626]">
                <X className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Datos de la agencia */}
            <div className="bg-[#1F2937] border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Datos de la agencia</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Nombre de la agencia <span className="text-[#7C3AED]">*</span></label>
                  <input
                    className={inputCls}
                    placeholder="Ej: Agencia Creativa MX"
                    value={form.agency_name}
                    onChange={e => setForm(f => ({ ...f, agency_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Correo del admin <span className="text-[#7C3AED]">*</span></label>
                  <input
                    className={inputCls}
                    type="email"
                    placeholder="admin@agencia.com"
                    value={form.agency_email}
                    onChange={e => setForm(f => ({ ...f, agency_email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Contraseña temporal <span className="text-[#7C3AED]">*</span></label>
                  <div className="relative">
                    <input
                      className={inputCls + ' pr-10 font-mono'}
                      value={form.temp_password}
                      onChange={e => setForm(f => ({ ...f, temp_password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={regeneratePassword}
                      title="Generar nueva contraseña"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#7C3AED] transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">Se enviará esta contraseña a la agencia. Cambiará al primer ingreso.</p>
                </div>
              </div>
            </div>

            {/* Plan selector */}
            <div className="bg-[#1F2937] border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Plan <span className="text-[#7C3AED]">*</span></h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLANS.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    selected={form.plan_id === plan.id}
                    onSelect={() => setForm(f => ({ ...f, plan_id: plan.id }))}
                  />
                ))}
              </div>
            </div>

            {/* Opciones adicionales */}
            <div className="bg-[#1F2937] border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Opciones adicionales</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Fecha de vencimiento <span className="text-white/30">(opcional — sin fecha = sin límite)</span></label>
                  <input
                    className={inputCls}
                    type="date"
                    value={form.expires_at}
                    onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Notas internas <span className="text-white/30">(opcional)</span></label>
                  <textarea
                    className={inputCls + ' resize-none'}
                    rows={3}
                    placeholder="Ej: Cliente referido, descuento especial, etc."
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={!isComplete || loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-[2px_3px_0_rgba(0,0,0,0.3)] transition-colors"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                {loading ? 'Creando...' : 'Crear licencia'}
              </button>
              <Link
                href="/superadmin/licencias"
                className="px-4 py-2.5 text-sm text-white/50 hover:text-white transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </form>

          {/* Preview card — 1/3 */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className={`bg-[#1F2937] border rounded-xl p-5 transition-colors ${isComplete ? 'border-[#7C3AED]/40' : 'border-white/10'}`}>
                <h2 className="text-sm font-semibold text-white mb-4">Resumen</h2>
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-white/55 mb-0.5">Agencia</p>
                    <p className={form.agency_name ? 'text-white font-medium' : 'text-white/20 italic'}>
                      {form.agency_name || 'Sin nombre'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/55 mb-0.5">Email</p>
                    <p className={form.agency_email ? 'text-white' : 'text-white/20 italic'}>
                      {form.agency_email || 'Sin email'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/55 mb-1">Plan</p>
                    {form.plan_id ? (
                      <span
                        className="inline-flex items-center font-semibold rounded-full px-2.5 py-1 text-xs"
                        style={{
                          color: PLANS.find(p => p.id === form.plan_id)?.color,
                          background: (PLANS.find(p => p.id === form.plan_id)?.color ?? '#7C3AED') + '20',
                        }}
                      >
                        {PLANS.find(p => p.id === form.plan_id)?.name}
                        {' — '}
                        ${PLANS.find(p => p.id === form.plan_id)?.price_monthly}/mes
                      </span>
                    ) : (
                      <p className="text-white/20 italic">Sin plan seleccionado</p>
                    )}
                  </div>
                  <div>
                    <p className="text-white/55 mb-0.5">Vencimiento</p>
                    <p className={form.expires_at ? 'text-white' : 'text-white/30 italic'}>
                      {form.expires_at
                        ? new Date(form.expires_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
                        : 'Sin límite'}
                    </p>
                  </div>
                </div>
                {isComplete && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#16A34A]">
                      <Check className="w-3 h-3" />
                      Listo para crear
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Success Modal ─────────────────────────────── */}
      {createdLicense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1F2937] border border-[#7C3AED]/30 rounded-2xl p-6 max-w-md w-full shadow-[6px_10px_0_rgba(0,0,0,0.4)]">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#dcfce7] flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#16A34A]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">¡Licencia creada!</h3>
                  <p className="text-white/55 text-xs mt-0.5">Comparte estas credenciales con la agencia</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setCreatedLicense(null); router.push('/superadmin/licencias'); }}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#111827] rounded-xl p-4 font-mono text-xs text-white/80 mb-4 border border-white/5 space-y-1.5">
              <div><span className="text-white/55">Agencia:    </span>{createdLicense.agency_name}</div>
              <div><span className="text-white/55">Email:      </span>{createdLicense.agency_email}</div>
              <div><span className="text-white/55">Contraseña: </span>
                <span className="text-[#7C3AED] font-semibold">{createdLicense.temp_password}</span>
              </div>
              <div><span className="text-white/55">Plan:       </span>{createdLicense.plan_id.toUpperCase()}</div>
              <div className="pt-1 border-t border-white/5">
                <span className="text-white/55">URL:        </span>
                <span className="text-[#00BD7D]">https://adpulse.com/login</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Copiado!' : 'Copiar credenciales'}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/superadmin/licencias/${createdLicense.id}`}
                  className="flex items-center justify-center px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm rounded-lg transition-colors border border-white/10"
                >
                  Ir a la licencia
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedLicense(null);
                    setForm({ agency_name: '', agency_email: '', temp_password: generatePassword(), plan_id: '', expires_at: '', notes: '' });
                    setError(null);
                  }}
                  className="flex items-center justify-center px-4 py-2.5 text-white/50 hover:text-white text-sm transition-colors"
                >
                  Crear otra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
