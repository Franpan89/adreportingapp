'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, Copy, Check, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface PortalUser {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function ClientUsers({ clientId }: { clientId: string }) {
  const [users, setUsers]             = useState<PortalUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [adding, setAdding]           = useState(false);
  const [error, setError]             = useState('');
  const [showForm, setShowForm]       = useState(false);

  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState(randomPassword);
  const [showPass, setShowPass]       = useState(false);
  const [copied, setCopied]           = useState<string | null>(null);
  const [newCreds, setNewCreds]       = useState<{ email: string; password: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/clients/${clientId}/users`);
      const d = await r.json() as { users?: PortalUser[] };
      setUsers(d.users ?? []);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true); setError('');
    try {
      const r = await fetch(`/api/clients/${clientId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: name, password }),
      });
      const d = await r.json() as { ok?: boolean; error?: string };
      if (!r.ok) { setError(d.error ?? 'Error al crear usuario.'); return; }

      setNewCreds({ email, password });
      setName(''); setEmail(''); setPassword(randomPassword());
      setShowForm(false);
      await load();
    } finally {
      setAdding(false);
    }
  };

  const handleRevoke = async (userId: string, userEmail: string | null) => {
    if (!confirm(`¿Revocar acceso de ${userEmail ?? 'este usuario'}?`)) return;
    await fetch(`/api/clients/${clientId}/users?userId=${userId}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#F3F4F6]">
        <div>
          <h3 className="text-sm font-semibold text-[#111827]">Acceso portal cliente</h3>
          <p className="text-xs text-[#6B7280] mt-0.5">Login y contraseña para que el cliente vea sus reportes</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(v => !v); setError(''); setNewCreds(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     bg-[#006666] text-white hover:bg-[#005555] transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Agregar acceso
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="px-5 py-4 bg-[#F9FAFB] border-b border-[#E5E7EB] space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Juan Rodríguez"
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#006666]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Correo *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="cliente@empresa.com"
                required
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#006666]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#374151]">Contraseña temporal *</label>
              <button
                type="button"
                onClick={() => setPassword(randomPassword())}
                className="flex items-center gap-1 text-xs text-[#006666] hover:underline"
              >
                <RefreshCw className="w-3 h-3" /> Generar nueva
              </button>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-20 rounded-lg border border-[#E5E7EB] text-sm font-mono outline-none focus:border-[#006666]"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button type="button" onClick={() => setShowPass(v => !v)} className="text-[#9CA3AF] hover:text-[#374151]">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => copy(password, 'form-pass')} className="text-[#9CA3AF] hover:text-[#374151]">
                  {copied === 'form-pass' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-xs text-[#6B7280] hover:bg-[#F3F4F6]">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={adding || !email}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#006666] text-white disabled:opacity-50"
            >
              {adding ? 'Creando…' : 'Crear acceso'}
            </button>
          </div>
        </form>
      )}

      {/* Credentials just created */}
      {newCreds && (
        <div className="mx-5 my-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-xs font-semibold text-green-700 mb-2">✓ Acceso creado — comparte estas credenciales con el cliente:</p>
          <div className="space-y-1">
            {[
              { label: 'URL', value: typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login', key: 'url' },
              { label: 'Email', value: newCreds.email, key: 'email' },
              { label: 'Contraseña', value: newCreds.password, key: 'pass' },
            ].map(({ label, value, key }) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-xs text-green-600 w-20 shrink-0">{label}:</span>
                <code className="flex-1 text-xs font-mono text-green-800 bg-green-100 px-2 py-0.5 rounded truncate">{value}</code>
                <button type="button" onClick={() => copy(value, key)} className="shrink-0 text-green-600 hover:text-green-800">
                  {copied === key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => copy(
              `URL: ${typeof window !== 'undefined' ? window.location.origin : ''}/login\nEmail: ${newCreds.email}\nContraseña: ${newCreds.password}`,
              'all',
            )}
            className="mt-2 text-xs text-green-700 hover:underline flex items-center gap-1"
          >
            {copied === 'all' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            Copiar todo
          </button>
        </div>
      )}

      {/* Users list */}
      <div className="divide-y divide-[#F3F4F6]">
        {loading && (
          <div className="px-5 py-4 text-xs text-[#9CA3AF]">Cargando…</div>
        )}
        {!loading && users.length === 0 && (
          <div className="px-5 py-6 text-center text-xs text-[#9CA3AF]">
            Sin accesos configurados. Agrega uno para que el cliente pueda iniciar sesión.
          </div>
        )}
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium text-[#111827]">{u.full_name ?? u.email}</p>
              {u.full_name && <p className="text-xs text-[#9CA3AF]">{u.email}</p>}
              <p className="text-xs text-[#D1D5DB] mt-0.5">
                Desde {new Date(u.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => u.user_id && handleRevoke(u.user_id, u.email)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Revocar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
