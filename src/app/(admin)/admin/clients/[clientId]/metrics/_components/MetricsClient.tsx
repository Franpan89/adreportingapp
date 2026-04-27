'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MetricConfigEditor } from '@/components/admin/MetricConfigEditor';
import { Card } from '@/components/ui/Card';
import { DEFAULT_METRIC_CONFIG } from '@/lib/metrics/definitions';
import type { MetricConfig } from '@/types';

interface Props {
  clientId: string;
  clientName: string;
}

export default function MetricsClient({ clientId, clientName }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(_metrics: MetricConfig[]) {
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
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a {clientName}
        </Link>
        <h1 className="text-xl font-bold text-[#111827] font-[Oswald] tracking-wide">
          Configuración de Métricas
        </h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">
          Controla qué métricas son visibles en el panel de {clientName}
        </p>
      </div>

      <div className="flex-1 px-6 py-5 max-w-2xl">
        {saved && (
          <div className="mb-4 px-4 py-3 bg-[#dcfce7] border border-[#16A34A]/20 rounded-lg text-sm text-[#16A34A] font-medium">
            ✓ Configuración de métricas guardada
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
