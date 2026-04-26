'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Link2, Unlink, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConnectionStatus {
  connected: boolean;
  connected_at?: string;
  token_preview?: string;
}

export function MetaConnector() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/agency/meta-connection')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false }));
  }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/agency/meta-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al conectar');
      setToken('');
      setSuccess(true);
      const s = await fetch('/api/agency/meta-connection').then(r => r.json());
      setStatus(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar Meta? Los clientes que usen el token de agencia no podrán sincronizar.')) return;
    setDisconnecting(true);
    await fetch('/api/agency/meta-connection', { method: 'DELETE' });
    setStatus({ connected: false });
    setDisconnecting(false);
  }

  if (status === null) {
    return <div className="h-12 bg-[#F3F4F6] rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      {status.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[#f0fdf4] border border-[#86efac] rounded-lg">
            <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#15803D]">Meta conectado</p>
              {status.connected_at && (
                <p className="text-xs text-[#16A34A]/70">
                  Conectado el {new Date(status.connected_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
            {status.token_preview && (
              <code className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">{status.token_preview}</code>
            )}
          </div>

          <p className="text-xs text-[#6B7280]">
            Al crear un cliente, podrás seleccionar la cuenta publicitaria desde la lista de cuentas accesibles con este token.
          </p>

          <Button
            variant="outline"
            size="sm"
            icon={<Unlink className="w-3.5 h-3.5" />}
            loading={disconnecting}
            onClick={handleDisconnect}
          >
            Desconectar Meta
          </Button>
        </div>
      ) : (
        <form onSubmit={handleConnect} className="space-y-3">
          <p className="text-sm text-[#374151]">
            Pega tu token de acceso de Meta (System User Token o Long-Lived Token) con acceso a las cuentas publicitarias de tu agencia.
          </p>

          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              required
              className="w-full px-3 py-2 pr-10 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2] font-mono"
            />
            <button
              type="button"
              onClick={() => setShowToken(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-[#DC2626] bg-[#fee2e2] border border-[#DC2626]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-[#16A34A] bg-[#dcfce7] border border-[#16A34A]/20 rounded-lg px-3 py-2">
              ✓ Token verificado y guardado correctamente.
            </p>
          )}

          <Button
            type="submit"
            size="sm"
            icon={<Link2 className="w-3.5 h-3.5" />}
            loading={saving}
          >
            {saving ? 'Verificando…' : 'Conectar Meta'}
          </Button>
        </form>
      )}
    </div>
  );
}
