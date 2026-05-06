'use client';
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { LicenseAddons } from '@/types';

const ADDONS = [
  {
    key: 'story_engine' as const,
    name: 'Story Engine',
    description: 'IA estratégica con 5 módulos: Strategy, Financials, Creative Request, Email Flows y Attraction Matrix. Powered by Claude.',
    price: '+$99/mes',
  },
];

export function LicenseAddons({
  licenseId,
  initialAddons,
}: {
  licenseId: string;
  initialAddons: LicenseAddons;
}) {
  const [addons, setAddons] = useState<LicenseAddons>(initialAddons);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(key: keyof LicenseAddons) {
    const next = { ...addons, [key]: !addons[key] };
    setSaving(key);
    setError(null);
    try {
      const res = await fetch(`/api/superadmin/licenses/${licenseId}/addons`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Error');
      setAddons(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="bg-[#1F2937] border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-[#7C3AED]" />
        <h2 className="text-sm font-semibold text-white">Add-ons</h2>
      </div>

      <div className="space-y-3">
        {ADDONS.map(addon => {
          const enabled = !!addons[addon.key];
          const loading = saving === addon.key;
          return (
            <div
              key={addon.key}
              className="flex items-start justify-between gap-4 p-3 rounded-lg bg-[#111827] border border-white/5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-white">{addon.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A78BFA] font-semibold">
                    {addon.price}
                  </span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">{addon.description}</p>
              </div>
              <button
                onClick={() => toggle(addon.key)}
                disabled={loading}
                className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${
                  enabled ? 'bg-[#7C3AED]' : 'bg-white/10'
                } disabled:opacity-50`}
                title={enabled ? 'Desactivar' : 'Activar'}
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 text-white animate-spin absolute inset-0 m-auto" />
                ) : (
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      enabled ? 'left-5' : 'left-1'
                    }`}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-3">{error}</p>
      )}
    </div>
  );
}
