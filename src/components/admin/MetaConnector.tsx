'use client';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Link2, Unlink, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { AdAccount } from '@/types';

interface ConnectionStatus {
  connected: boolean;
  connected_at?: string;
  token_preview?: string;
  is_owner?: boolean;
}

export function MetaConnector() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [accounts, setAccounts] = useState<AdAccount[] | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    setAccountsError(null);
    try {
      const res = await fetch('/api/agency/meta-connection/accounts');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al cargar cuentas');
      setAccounts(data.accounts ?? []);
    } catch (err) {
      setAccountsError(err instanceof Error ? err.message : 'Error al cargar cuentas');
      setAccounts(null);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/agency/meta-connection')
      .then(r => r.json())
      .then((s: ConnectionStatus) => {
        setStatus(s);
        if (s.connected) fetchAccounts();
      })
      .catch(() => setStatus({ connected: false }));
  }, [fetchAccounts]);

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
      fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar Meta? Los clientes que usen el token de agencia no podrán sincronizar.')) return;
    setDisconnecting(true);
    try {
      const res = await fetch('/api/agency/meta-connection', { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al desconectar');
      setStatus({ connected: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desconectar');
    } finally {
      setDisconnecting(false);
    }
  }

  if (status === null) {
    return <div className="h-12 bg-[#F3F4F6] rounded-lg animate-pulse" />;
  }

  const isOwner = status.is_owner !== false; // undefined (legacy) treated as owner

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

          {/* Ad accounts list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide">
                Cuentas publicitarias
                {accounts !== null && (
                  <span className="ml-1.5 text-[#9CA3AF] font-normal normal-case">
                    ({accounts.length} activa{accounts.length !== 1 ? 's' : ''})
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={fetchAccounts}
                disabled={loadingAccounts}
                className="text-[#9CA3AF] hover:text-[#6B7280] disabled:opacity-40 transition-colors"
                title="Actualizar lista"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAccounts ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {accountsError && (
              <p className="text-xs text-[#DC2626] bg-[#fee2e2] border border-[#DC2626]/20 rounded-lg px-3 py-2">
                {accountsError}
              </p>
            )}

            {loadingAccounts && accounts === null && (
              <div className="space-y-1.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-9 bg-[#F3F4F6] rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {!loadingAccounts && accounts !== null && accounts.length === 0 && (
              <p className="text-xs text-[#9CA3AF] italic">No se encontraron cuentas activas.</p>
            )}

            {accounts !== null && accounts.length > 0 && (
              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="text-left px-3 py-2 font-semibold text-[#6B7280] uppercase tracking-wide">Nombre</th>
                      <th className="text-left px-3 py-2 font-semibold text-[#6B7280] uppercase tracking-wide">ID</th>
                      <th className="text-center px-3 py-2 font-semibold text-[#6B7280] uppercase tracking-wide">Estado</th>
                      <th className="text-right px-3 py-2 font-semibold text-[#6B7280] uppercase tracking-wide">Moneda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((a, i) => (
                      <tr
                        key={a.id}
                        className={`border-b border-[#F3F4F6] last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}
                      >
                        <td className="px-3 py-2 font-medium text-[#111827]">{a.name}</td>
                        <td className="px-3 py-2 text-[#6B7280] font-mono">{a.id}</td>
                        <td className="px-3 py-2 text-center">
                          {a.account_status === 1
                            ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#dcfce7] text-[#16A34A] font-medium">● Activa</span>
                            : <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] font-medium">{a.account_status}</span>
                          }
                        </td>
                        <td className="px-3 py-2 text-right text-[#6B7280]">{a.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {isOwner ? (
            <Button
              variant="outline"
              size="sm"
              icon={<Unlink className="w-3.5 h-3.5" />}
              loading={disconnecting}
              onClick={handleDisconnect}
            >
              Desconectar Meta
            </Button>
          ) : (
            <p className="text-xs text-[#6B7280]">Conexión gestionada por el propietario de la agencia.</p>
          )}
        </div>
      ) : !isOwner ? (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
          <Link2 className="w-4 h-4 text-[#9CA3AF] shrink-0" />
          <p className="text-sm text-[#6B7280]">El propietario de la agencia aún no ha conectado Meta.</p>
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
