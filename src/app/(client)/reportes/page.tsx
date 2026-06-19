import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, ExternalLink } from 'lucide-react';
import { getAuthUser } from '@/lib/supabase/auth';
import { getClientPortalUser } from '@/lib/supabase/client-portal';
import { listReportsForClient } from '@/lib/supabase/reports';

export default async function ClientReportesPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const portal = await getClientPortalUser(user.id);
  if (!portal) redirect('/admin/dashboard');

  const reports = await listReportsForClient(portal.clientId);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-[#111827] mb-6">Reportes publicados</h1>

      {reports.length === 0 ? (
        <div className="text-center py-16 text-[#9CA3AF]">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aún no hay reportes publicados para tu cuenta.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <Link
              key={report.id}
              href={`/reportes/${report.id}`}
              className="flex items-center justify-between px-5 py-4 rounded-xl bg-white
                         border border-[#E5E7EB] hover:border-[#006666] hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#006666]/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#006666]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827] group-hover:text-[#006666] transition-colors">
                    {report.title}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">
                    {report.period_start} → {report.period_end}
                    {report.published_at && (
                      <> · Publicado {new Date(report.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</>
                    )}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#006666] shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
