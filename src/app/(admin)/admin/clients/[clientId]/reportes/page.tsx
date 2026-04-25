import Link from 'next/link';
import { ArrowLeft, FileText, Calendar, ExternalLink } from 'lucide-react';
import { MOCK_CLIENTS } from '@/lib/reports/mock';
import { listAllReportsForClient } from '@/lib/supabase/reports';
import { GenerateReportButton } from './_components/GenerateReportButton';
import { ReportRowActions } from './_components/ReportRowActions';

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function AdminClientReportesPage({ params }: PageProps) {
  const { clientId } = await params;
  const client = MOCK_CLIENTS.find(c => c.id === clientId) ?? MOCK_CLIENTS[0];
  const reports = await listAllReportsForClient(clientId);

  return (
    <div className="flex-1 flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/admin/clients/${clientId}`} className="flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#111827]">
              <ArrowLeft className="w-3.5 h-3.5" /> {client.name}
            </Link>
            <span className="text-[#E5E7EB]">/</span>
            <span className="text-sm font-medium text-[#111827]">Reportes</span>
          </div>
          <GenerateReportButton clientId={clientId} />
        </div>
      </div>

      <div className="flex-1 px-6 py-5">
        <div className="mb-4">
          <h1
            className="text-xl font-bold text-[#111827]"
            style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em' }}
          >
            Reportes de {client.name}
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {reports.length} {reports.length === 1 ? 'reporte' : 'reportes'} generados. El cliente verá solo los publicados.
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-xl py-20 text-center">
            <FileText className="w-8 h-8 text-[#9CA3AF] mx-auto mb-3" />
            <p className="text-[#6B7280] text-sm">Aún no hay reportes para este cliente.</p>
            <p className="text-[#9CA3AF] text-xs mt-1">Usá el botón “Generar reporte” para crear el primero.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#6B7280]">
                  <th className="px-5 py-3 font-medium">Título</th>
                  <th className="px-5 py-3 font-medium">Período</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Publicado</th>
                  <th className="px-5 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB]">
                    <td className="px-5 py-3 font-medium text-[#111827]">{r.title}</td>
                    <td className="px-5 py-3 text-[#6B7280]">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        {formatPeriod(r.period_start, r.period_end)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-[#6B7280] tabular-nums">
                      {r.published_at ? formatDate(r.published_at) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/reportes/${r.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#00BD7D] hover:underline"
                        >
                          Ver <ExternalLink className="w-3 h-3" />
                        </Link>
                        <ReportRowActions reportId={r.id} status={r.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: 'draft' | 'published' }) {
  if (status === 'published') {
    return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#dcfce7] text-[#16A34A]">Publicado</span>;
  }
  return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F3F4F6] text-[#6B7280]">Borrador</span>;
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  const e = new Date(end).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${s} — ${e}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}
