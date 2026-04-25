import Link from 'next/link';
import { FileText, Calendar, ChevronRight } from 'lucide-react';
import { listReportsForClient } from '@/lib/supabase/reports';

// Demo mode: hardcoded client. In real mode this comes from the session.
const CURRENT_CLIENT_ID = 'client-1';

export default async function ReportesPage() {
  const reports = await listReportsForClient(CURRENT_CLIENT_ID);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <h1
          className="text-xl font-bold text-[#111827]"
          style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em' }}
        >
          Reportes
        </h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          {reports.length} {reports.length === 1 ? 'reporte disponible' : 'reportes disponibles'}
        </p>
      </div>

      <div className="flex-1 px-6 py-5">
        {reports.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-xl py-20 text-center">
            <FileText className="w-8 h-8 text-[#9CA3AF] mx-auto mb-3" />
            <p className="text-[#6B7280] text-sm">Aún no hay reportes publicados para este cliente.</p>
            <p className="text-[#9CA3AF] text-xs mt-1">Los reportes aparecerán aquí cuando el equipo los genere.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map(r => (
              <Link
                key={r.id}
                href={`/reportes/${r.id}`}
                className="group bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#00BD7D]/40 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#00BD7D]/10 border border-[#00BD7D]/20 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#00BD7D]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#111827] text-sm truncate">{r.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#6B7280]">
                      <Calendar className="w-3 h-3" />
                      {formatPeriod(r.period_start, r.period_end)}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#6B7280] line-clamp-3 mb-3">{r.executive_summary}</p>

                <div className="flex items-center justify-between pt-3 border-t border-[#F3F4F6]">
                  <span className="text-[10px] text-[#9CA3AF]">
                    Publicado {formatDate(r.published_at ?? r.created_at)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#00BD7D] font-medium group-hover:gap-2 transition-all">
                    Ver reporte
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  const e = new Date(end).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${s} — ${e}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}
