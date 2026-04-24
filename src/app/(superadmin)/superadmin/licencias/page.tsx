import Link from 'next/link';
import { Plus } from 'lucide-react';
import { LicenseTable } from './_components/LicenseTable';
import { getLicenses } from '@/lib/supabase/licenses';
import { cn } from '@/lib/utils/cn';
import type { LicenseStatus } from '@/types';

const FILTER_TABS: { key: string; label: string; status?: LicenseStatus }[] = [
  { key: 'all',       label: 'Todas' },
  { key: 'active',    label: 'Activas',     status: 'active' },
  { key: 'trial',     label: 'Trial',       status: 'trial' },
  { key: 'expired',   label: 'Vencidas',    status: 'expired' },
  { key: 'suspended', label: 'Suspendidas', status: 'suspended' },
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function LicenciasPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const activeTab = status ?? 'all';

  const allLicenses = await getLicenses();
  const filtered = activeTab === 'all'
    ? allLicenses
    : allLicenses.filter(l => l.status === activeTab);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1F2937] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em' }}>
              Licencias
            </h1>
            <p className="text-sm text-white/40 mt-0.5">{allLicenses.length} licencias registradas</p>
          </div>
          <Link
            href="/superadmin/licencias/nueva"
            className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium rounded-lg shadow-[2px_3px_0_rgba(0,0,0,0.3)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva licencia
          </Link>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 space-y-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-[#1F2937] border border-white/10 p-1 rounded-xl w-fit">
          {FILTER_TABS.map(tab => (
            <Link
              key={tab.key}
              href={tab.key === 'all' ? '/superadmin/licencias' : `/superadmin/licencias?status=${tab.key}`}
              className={cn(
                'px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                activeTab === tab.key
                  ? 'bg-[#7C3AED] text-white shadow-[2px_3px_0_rgba(0,0,0,0.2)]'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              {tab.label}
              <span className={cn(
                'ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'
              )}>
                {tab.key === 'all' ? allLicenses.length : allLicenses.filter(l => l.status === tab.key).length}
              </span>
            </Link>
          ))}
        </div>

        {/* Table */}
        <LicenseTable licenses={filtered} />
      </div>
    </div>
  );
}
