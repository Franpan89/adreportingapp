import { cn } from '@/lib/utils/cn';
import type { PlanId, LicenseStatus } from '@/types';

type Size = 'sm' | 'md';

/* ── Plan Badge ─────────────────────────────────────── */
const PLAN_CONFIG: Record<PlanId, { label: string; color: string; bg: string }> = {
  starter:    { label: 'Starter',    color: '#6366F1', bg: 'rgba(99,102,241,0.15)' },
  pro:        { label: 'Pro',        color: '#7C3AED', bg: 'rgba(124,58,237,0.15)' },
  enterprise: { label: 'Enterprise', color: '#4F46E5', bg: 'rgba(79,70,229,0.15)'  },
};

export function PlanBadge({ planId, size = 'md' }: { planId: PlanId; size?: Size }) {
  const cfg = PLAN_CONFIG[planId];
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

/* ── License Status Badge ───────────────────────────── */
const STATUS_CONFIG: Record<LicenseStatus, { label: string; dotColor: string; textClass: string; bgClass: string }> = {
  active:    { label: 'Activa',      dotColor: '#16A34A', textClass: 'text-[#16A34A]', bgClass: 'bg-[#dcfce7]'  },
  trial:     { label: 'Trial',       dotColor: '#D97706', textClass: 'text-[#D97706]', bgClass: 'bg-[#fef3c7]'  },
  suspended: { label: 'Suspendida',  dotColor: '#DC2626', textClass: 'text-[#DC2626]', bgClass: 'bg-[#fee2e2]'  },
  expired:   { label: 'Vencida',     dotColor: '#6B7280', textClass: 'text-[#6B7280]', bgClass: 'bg-[#F3F4F6]'  },
};

export function LicenseStatusBadge({ status, size = 'md' }: { status: LicenseStatus; size?: Size }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        cfg.bgClass, cfg.textClass,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dotColor }} />
      {cfg.label}
    </span>
  );
}
