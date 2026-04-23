'use client';
import { useState } from 'react';
import { Check, AlertTriangle, X, RefreshCw } from 'lucide-react';
import type { LicenseStatus } from '@/types';

interface LicenseActionsProps {
  licenseId: string;
  initialStatus: LicenseStatus;
  agencyName: string;
}

export function LicenseActions({ licenseId, initialStatus, agencyName }: LicenseActionsProps) {
  const [status, setStatus] = useState<LicenseStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  async function changeStatus(newStatus: LicenseStatus) {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setStatus(newStatus);
    setLoading(false);
    showBanner(`Estado cambiado a: ${newStatus}`);
  }

  async function handleRevoke() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setRevoked(true);
    setLoading(false);
    setShowRevokeModal(false);
    showBanner('Licencia revocada (modo demo — no persistido)');
  }

  function showBanner(msg: string) {
    setBanner(msg);
    setTimeout(() => setBanner(null), 3500);
  }

  if (revoked) {
    return (
      <div className="bg-[#1F2937] border border-[#DC2626]/30 rounded-xl p-5">
        <p className="text-sm text-[#DC2626] font-medium">Licencia revocada</p>
        <p className="text-xs text-white/40 mt-1">El acceso de la agencia ha sido eliminado.</p>
      </div>
    );
  }

  return (
    <>
      {/* Success banner */}
      {banner && (
        <div className="mb-3 flex items-center gap-2 px-4 py-2.5 bg-[#dcfce7] border border-[#16A34A]/20 rounded-lg text-sm text-[#16A34A]">
          <Check className="w-4 h-4 shrink-0" />
          {banner}
        </div>
      )}

      {/* Status card */}
      <div className="bg-[#1F2937] border border-white/10 rounded-xl p-5 space-y-4">
        <div>
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Estado actual</p>
          <StatusDisplay status={status} />
        </div>

        {/* Action buttons */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          {status === 'active' && (
            <ActionButton
              label="Suspender licencia"
              variant="danger"
              loading={loading}
              onClick={() => changeStatus('suspended')}
            />
          )}
          {status === 'suspended' && (
            <ActionButton
              label="Reactivar licencia"
              variant="success"
              loading={loading}
              onClick={() => changeStatus('active')}
            />
          )}
          {status === 'trial' && (
            <>
              <ActionButton
                label="Activar licencia"
                variant="primary"
                loading={loading}
                onClick={() => changeStatus('active')}
              />
              <ActionButton
                label="Suspender licencia"
                variant="danger"
                loading={loading}
                onClick={() => changeStatus('suspended')}
              />
            </>
          )}
          {status === 'expired' && (
            <ActionButton
              label="Reactivar licencia"
              variant="primary"
              loading={loading}
              onClick={() => changeStatus('active')}
            />
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[#1F2937] border border-[#DC2626]/30 rounded-xl p-5">
        <div className="flex items-center gap-2 text-[#DC2626] mb-1">
          <AlertTriangle className="w-4 h-4" />
          <p className="text-sm font-semibold">Zona de peligro</p>
        </div>
        <p className="text-xs text-white/40 mb-4">
          Esta acción eliminará el acceso de la agencia permanentemente y no se puede deshacer.
        </p>
        <button
          type="button"
          onClick={() => setShowRevokeModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#DC2626]/10 hover:bg-[#DC2626]/20 text-[#DC2626] text-sm font-medium rounded-lg border border-[#DC2626]/20 transition-colors"
        >
          Revocar licencia
        </button>
      </div>

      {/* Revoke confirmation modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1F2937] border border-[#DC2626]/30 rounded-2xl p-6 max-w-sm w-full shadow-[4px_8px_0_rgba(0,0,0,0.4)]">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-[#fee2e2] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
              </div>
              <button type="button" onClick={() => setShowRevokeModal(false)} className="text-white/30 hover:text-white/60">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-white font-semibold text-base mb-2">¿Confirmar revocación?</h3>
            <p className="text-white/50 text-sm mb-5">
              Esto eliminará el acceso de <span className="text-white font-medium">{agencyName}</span> a AdPulse. No se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRevoke}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Sí, revocar
              </button>
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                className="flex-1 px-4 py-2.5 text-white/60 hover:text-white text-sm rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatusDisplay({ status }: { status: LicenseStatus }) {
  const map: Record<LicenseStatus, { label: string; color: string; bg: string }> = {
    active:    { label: 'Activa',     color: '#16A34A', bg: '#dcfce7' },
    trial:     { label: 'Trial',      color: '#D97706', bg: '#fef3c7' },
    suspended: { label: 'Suspendida', color: '#DC2626', bg: '#fee2e2' },
    expired:   { label: 'Vencida',    color: '#6B7280', bg: '#F3F4F6' },
  };
  const cfg = map[status];
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function ActionButton({
  label, variant, loading, onClick,
}: {
  label: string;
  variant: 'primary' | 'danger' | 'success';
  loading: boolean;
  onClick: () => void;
}) {
  const styles = {
    primary: 'bg-[#7C3AED]/15 hover:bg-[#7C3AED]/25 text-[#7C3AED] border-[#7C3AED]/20',
    danger:  'bg-[#DC2626]/10 hover:bg-[#DC2626]/20 text-[#DC2626] border-[#DC2626]/20',
    success: 'bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#16A34A] border-[#16A34A]/20',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${styles[variant]}`}
    >
      {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
      {label}
    </button>
  );
}
