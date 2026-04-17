'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MetricConfigEditor } from '@/components/admin/MetricConfigEditor';
import { Card } from '@/components/ui/Card';
import { DEFAULT_METRIC_CONFIG } from '@/lib/metrics/definitions';
import { MOCK_CLIENTS } from '@/lib/reports/mock';
import type { MetricConfig } from '@/types';

export default function MetricsConfigPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const client = MOCK_CLIENTS.find(c => c.id === clientId) ?? MOCK_CLIENTS[0];
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(metrics: MetricConfig[]) {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <Link href={`/admin/clients/${clientId}`} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {client.name}
        </Link>
        <h1 className="text-xl font-bold text-[#111827] font-[Oswald] tracking-wide">
          Metric Configuration
        </h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">
          Control which metrics are visible in {client.name}&apos;s dashboard
        </p>
      </div>

      <div className="flex-1 px-6 py-5 max-w-2xl">
        {saved && (
          <div className="mb-4 px-4 py-3 bg-[#dcfce7] border border-[#16A34A]/20 rounded-lg text-sm text-[#16A34A] font-medium">
            ✓ Metric configuration saved
          </div>
        )}
        <Card>
          <MetricConfigEditor
            metrics={DEFAULT_METRIC_CONFIG}
            onSave={handleSave}
            saving={saving}
          />
        </Card>
      </div>
    </div>
  );
}
