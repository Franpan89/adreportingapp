'use client';
import { useState, useEffect, useRef } from 'react';
import { LogoUpload } from '@/components/ui/LogoUpload';

export function AgencyLogoSetting() {
  const [logoUrl,     setLogoUrl]     = useState<string | null>(null);
  const [agencyName,  setAgencyName]  = useState('');
  const [color,       setColor]       = useState('#00BD7D');
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/agency/settings')
      .then(r => r.json())
      .then(d => {
        setLogoUrl(d.logo_url ?? null);
        setAgencyName(d.agency_name ?? '');
        setColor(d.primary_color ?? '#00BD7D');
      })
      .catch(() => {});
  }, []);

  async function save(patch: { logo_url?: string | null; agency_name?: string; primary_color?: string }) {
    setSaving(true); setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      await fetch('/api/agency/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      setSaved(true);
      saveTimer.current = setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <LogoUpload
        currentUrl={logoUrl}
        folder="agency"
        label="Logo de la agencia"
        onSuccess={url => { setLogoUrl(url || null); save({ logo_url: url || null }); }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-[#374151] mb-1 block">Nombre de la agencia</span>
          <input
            type="text"
            value={agencyName}
            onChange={e => setAgencyName(e.target.value)}
            onBlur={() => save({ agency_name: agencyName })}
            placeholder="Ej. Web My Money"
            className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BD7D]/30 focus:border-[#00BD7D]"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-[#374151] mb-1 block">Color principal de marca</span>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              onBlur={() => save({ primary_color: color })}
              className="w-10 h-10 rounded-lg border border-[#E5E7EB] cursor-pointer p-0.5"
            />
            <span className="text-sm font-mono text-[#6B7280]">{color}</span>
          </div>
        </label>
      </div>

      <div className="h-4 flex items-center">
        {saving && <p className="text-xs text-[#9CA3AF]">Guardando…</p>}
        {!saving && saved && <p className="text-xs text-[#00BD7D]">✓ Configuración guardada</p>}
      </div>
    </div>
  );
}
