'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', timezone: 'America/New_York' });

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    router.push('/admin/clients');
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <Link href="/admin/clients" className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver a clientes
        </Link>
        <h1 className="text-xl font-bold text-[#111827] font-[Oswald] tracking-wide">Agregar nuevo cliente</h1>
      </div>

      <div className="flex-1 px-6 py-5 max-w-lg">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
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
