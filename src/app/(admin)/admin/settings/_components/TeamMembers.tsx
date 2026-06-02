'use client';
import { useEffect, useState } from 'react';
import { UserPlus, Trash2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Select';

interface Member {
  id: string;
  email: string;
  full_name: string | null;
  role: 'owner' | 'member';
  status: 'active' | 'invited' | 'disabled';
  member_user_id: string | null;
}

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function TeamMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(randomPassword());

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/agency/team');
      const d = await r.json();
      setMembers(d.members ?? []);
      setIsOwner(!!d.is_owner);
    } catch {
      setError('No se pudo cargar el equipo.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true); setError('');
    try {
      const r = await fetch('/api/agency/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, email, password }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? 'No se pudo agregar el miembro.'); return; }
      setName(''); setEmail(''); setPassword(randomPassword());
      await load();
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este miembro? Su acceso será revocado.')) return;
    setError('');
    const r = await fetch(`/api/agency/team?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const d = await r.json();
    if (!r.ok) { setError(d.error ?? 'No se pudo eliminar el miembro.'); return; }
    await load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#5a6472]">
        Los miembros del equipo acceden con su propio inicio de sesión y comparten todos los clientes, estadísticas y reportes de la agencia.
      </p>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-[#5a6472]">Cargando…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-[#5a6472]">Aún no hay miembros en el equipo.</p>
        ) : (
          members.map(m => (
            <div key={m.id} className="neu-inset-sm flex items-center justify-between px-3 py-2.5 rounded-lg">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1E2938] truncate">{m.full_name || m.email}</p>
                <p className="text-xs text-[#5a6472] truncate">{m.email}</p>
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  aria-label={`Eliminar ${m.email}`}
                  className="neu-pressable shrink-0 ml-3 p-2 rounded-md text-[#5a6472] hover:text-[#FF2157] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006666]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add form — owner only */}
      {isOwner && (
        <form onSubmit={add} className="neu-inset rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#006666]">
            <UserPlus className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Agregar miembro</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" />
            <Input label="Correo electrónico" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="persona@agencia.com" />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input label="Contraseña temporal" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button type="button" variant="outline" size="md" icon={<KeyRound className="w-4 h-4" />} onClick={() => setPassword(randomPassword())}>
              Generar
            </Button>
          </div>
          <p className="text-xs text-[#5a6472]">Comparte esta contraseña con el miembro; podrá cambiarla después.</p>
          {error && <p className="text-xs text-[#FF2157]">{error}</p>}
          <Button type="submit" loading={adding} icon={<UserPlus className="w-4 h-4" />}>
            Agregar al equipo
          </Button>
        </form>
      )}
      {!isOwner && error && <p className="text-xs text-[#FF2157]">{error}</p>}
    </div>
  );
}
