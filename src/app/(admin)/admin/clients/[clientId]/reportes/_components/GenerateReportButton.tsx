'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, X } from 'lucide-react';

export function GenerateReportButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const defaultStart = toYmd(firstOfMonth);
  const defaultEnd = toYmd(today);
  const defaultTitle = `Reporte ${today.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/client-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:    clientId,
          title:        String(form.get('title') ?? defaultTitle),
          period_start: String(form.get('period_start') ?? defaultStart),
          period_end:   String(form.get('period_end') ?? defaultEnd),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Error al generar el reporte');
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#00BD7D] hover:bg-[#00a86e] text-white text-sm font-medium rounded-lg shadow-[2px_3px_0_rgba(0,0,0,0.15)] transition-colors"
      >
        <Plus className="w-4 h-4" />
        Generar reporte
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-[#111827]">Generar nuevo reporte</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Se creará como borrador. Podrás publicarlo desde la tabla.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar modal"
                className="text-[#9CA3AF] hover:text-[#111827]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Título">
                <input
                  name="title"
                  defaultValue={defaultTitle}
                  required
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BD7D]/30 focus:border-[#00BD7D]"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Período inicio">
                  <input type="date" name="period_start" defaultValue={defaultStart} required className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BD7D]/30 focus:border-[#00BD7D]" />
                </Field>
                <Field label="Período fin">
                  <input type="date" name="period_end" defaultValue={defaultEnd} required className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BD7D]/30 focus:border-[#00BD7D]" />
                </Field>
              </div>

              {error && (
                <div role="alert" className="text-xs text-[#DC2626] bg-[#fee2e2] border border-[#DC2626]/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00BD7D] hover:bg-[#00a86e] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Generar borrador
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 text-[#6B7280] hover:text-[#111827] text-sm rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors"
                >
                  Cancelar
                </button>
              </div>

              <p className="text-[11px] text-[#9CA3AF] leading-relaxed pt-2 border-t border-[#F3F4F6]">
                Modo demo: el reporte se genera con datos simulados (creativos, inversión, audiencias y recomendaciones).
                Cuando esté conectado a Supabase, los datos vendrán de las cuentas publicitarias sincronizadas.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[#374151] mb-1">{label}</span>
      {children}
    </label>
  );
}

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}
