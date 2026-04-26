'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al eliminar');
      router.push('/admin/clients');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        icon={<Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />}
        onClick={() => setOpen(true)}
      >
        <span className="text-[#DC2626]">Eliminar</span>
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#fee2e2] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5 text-[#DC2626]" />
                </div>
                <h2 className="text-base font-semibold text-[#111827]">Eliminar cliente</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#374151] mb-2">
              Estás por eliminar permanentemente a <span className="font-semibold">{clientName}</span>.
            </p>
            <p className="text-sm text-[#6B7280] mb-5">
              Se borrarán todas sus credenciales, campañas y datos históricos. Esta acción no se puede deshacer.
            </p>

            {error && (
              <p className="text-xs text-[#DC2626] bg-[#fee2e2] rounded-lg px-3 py-2 mb-4">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {loading ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-[#6B7280] hover:text-[#111827] text-sm rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
