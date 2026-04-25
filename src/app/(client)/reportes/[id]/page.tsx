import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getReport } from '@/lib/supabase/reports';
import { ReportView } from '@/components/reports/ReportView';
import { DownloadPdfButton } from '@/components/reports/DownloadPdfButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReporteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report || report.status !== 'published') notFound();

  return (
    <div className="flex-1 flex flex-col bg-[#F9FAFB]">
      {/* Top actions — hidden on print */}
      <div className="print:hidden border-b border-[#E5E7EB] bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link
          href="/reportes"
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a reportes
        </Link>
        <DownloadPdfButton />
      </div>

      {/* Printable area */}
      <div id="report-print-area" className="flex-1 px-6 py-8 print:p-0">
        <ReportView report={report} />
      </div>
    </div>
  );
}
