'use client';
import { Download } from 'lucide-react';

interface Props {
  reportId: string;
}

export function DownloadPdfButton({ reportId }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.open(`/admin/reportes/${reportId}/print`, '_blank')}
      className="flex items-center gap-2 px-4 py-2 bg-[#00BD7D] hover:bg-[#00a86e] text-white text-sm font-medium rounded-lg shadow-[2px_3px_0_rgba(0,0,0,0.15)] transition-colors"
    >
      <Download className="w-4 h-4" />
      Descargar PDF
    </button>
  );
}
