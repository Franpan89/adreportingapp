'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { LogoUpload } from '@/components/ui/LogoUpload';
import type { AdAccount } from '@/types';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', timezone: 'America/New_York' });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [metaAccountId, setMetaAccountId] = useState('');
  const [adAccounts, setAdAccounts] = useState<AdAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  useEffect(() => {
    fetch('/api/agency/meta-connection')
      .then(r => r.json())
      .then(status => {
        if (!status.connected) return;
        return fetch('/api/agency/meta-connection/accounts')
          .then(r => r.json())
          .then(data => setAdAccounts(data.accounts ?? []));
      })
      .catch(() => setAdAccounts([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          logo_url: logoUrl || undefined,
          meta_account_id: metaAccountId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al crear cliente');
      router.push('/admin/clients');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <Link href="/admin/clients" className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver a clientes
        </Link>
        <h1 className="text-xl font-bold text-[#111827] font-[Roboto] tracking-wide">Agregar nuevo cliente</h1>
      </div>

      <div className="flex-1 px-6 py-5 max-w-lg">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <LogoUpload
              currentUrl={logoUrl}
              folder="clients"
              label="Logo del cliente (opcional)"
              size="sm"
              onSuccess={url => setLogoUrl(url || null)}
            />
            <Input
              label="Nombre del cliente"
              value={form.name}
              placeholder="Luxe Cosmetics"
              onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
              required
            />
            <Input
              label="Slug (identificador URL)"
              value={form.slug}
              placeholder="luxe-cosmetics"
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              hint="Se usa en URLs. Minúsculas y guiones únicamente."
              required
            />
            <Input
              label="Zona horaria"
              value={form.timezone}
              onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              placeholder="America/New_York"
            />

            {adAccounts !== null && adAccounts.length > 0 && (
              <label className="block">
                <span className="block text-xs font-medium text-[#374151] mb-1">
                  Cuenta Meta Ads
                  <span className="ml-1 text-[#9CA3AF] font-normal">(opcional)</span>
                </span>
                <select
                  value={metaAccountId}
                  onChange={e => setMetaAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2] bg-white text-[#111827]"
                >
                  <option value="">— Sin cuenta Meta por ahora —</option>
                  {adAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.id}) · {a.currency}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#9CA3AF]">
                  Se vinculará automáticamente al cliente para sincronizar.
                </p>
              </label>
            )}

            {adAccounts !== null && adAccounts.length === 0 && (
              <p className="text-xs text-[#9CA3AF] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2">
                Meta conectado pero sin cuentas activas disponibles.
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="submit" loading={loading}>Crear cliente</Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
