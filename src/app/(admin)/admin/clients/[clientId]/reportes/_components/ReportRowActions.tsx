'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Send, RefreshCw } from 'lucide-react';
import type { ClientReportStatus } from '@/types';

interface Props {
  reportId: string;
  status: ClientReportStatus;
}

export function ReportRowActions({ reportId, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | 'publish' | 'delete'>(null);

  async function publish() {
    if (busy) return;
    setBusy('publish');
    try {
      const res = await fetch(`/api/client-reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      if (!res.ok) throw new Error('No se pudo publicar');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al publicar');
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (busy) return;
    if (!confirm('¿Eliminar este reporte? Esta acción no se puede deshacer.')) return;
    setBusy('delete');
    try {
      const res = await fetch(`/api/client-reports/${reportId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="inline-flex items-center gap-1">
      {status === 'draft' && (
        <button
          type="button"
          onClick={publish}
          disabled={busy !== null}
          aria-label="Publicar reporte"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[#16A34A] hover:bg-[#dcfce7] disabled:opacity-50 transition-colors"
        >
          {busy === 'publish' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          Publicar
        </button>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={busy !== null}
        aria-label="Eliminar reporte"
        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[#DC2626] hover:bg-[#fee2e2] disabled:opacity-50 transition-colors"
      >
        {busy === 'delete' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
