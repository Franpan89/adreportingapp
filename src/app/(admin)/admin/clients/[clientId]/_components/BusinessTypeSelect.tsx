'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { BusinessType } from '@/types';

const OPTIONS: { value: BusinessType; label: string }[] = [
  { value: 'ecommerce',         label: 'Ecommerce' },
  { value: 'high_ticket_local', label: 'Local — high-ticket' },
  { value: 'low_ticket_local',  label: 'Local — low-ticket' },
  { value: 'b2b',               label: 'B2B / SaaS' },
  { value: 'restaurant',        label: 'Restaurante' },
];

interface BusinessTypeSelectProps {
  clientId: string;
  initial: BusinessType | null;
}

export function BusinessTypeSelect({ clientId, initial }: BusinessTypeSelectProps) {
  const router = useRouter();
  const [value, setValue] = useState<BusinessType | ''>(initial ?? '');
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: BusinessType | '') {
    setValue(next);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}/business-type`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_type: next === '' ? null : next }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Error al guardar');
        setSavedAt(Date.now());
        // Server-rendered KPI defaults depend on business_type — refresh.
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Briefcase className="w-3.5 h-3.5 text-[#9CA3AF]" />
      <select
        value={value}
        disabled={pending}
        onChange={e => handleChange(e.target.value as BusinessType | '')}
        className={cn(
          'text-sm bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#00BD7D] focus:ring-2 focus:ring-[#00BD7D]/20 disabled:opacity-50',
          error && 'border-[#DC2626]',
        )}
      >
        <option value="">— Sin clasificar —</option>
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {savedAt && !pending && !error && (
        <span className="inline-flex items-center gap-1 text-xs text-[#16A34A]">
          <Check className="w-3 h-3" /> guardado
        </span>
      )}
      {error && (
        <span className="inline-flex items-center gap-1 text-xs text-[#DC2626]" title={error}>
          <AlertCircle className="w-3 h-3" /> error
        </span>
      )}
    </div>
  );
}
