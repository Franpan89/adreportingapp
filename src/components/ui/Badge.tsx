import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes } from 'react';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'meta' | 'google' | 'tiktok';
type Size = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
  dot?: boolean;
}

const variants: Record<Variant, string> = {
  default:  'bg-[#F3F4F6] text-[#374151]',
  primary:  'bg-[#e6f9f4] text-[#00BD7D]',
  success:  'bg-[#dcfce7] text-[#16A34A]',
  warning:  'bg-[#fef3c7] text-[#D97706]',
  danger:   'bg-[#fee2e2] text-[#DC2626]',
  meta:     'bg-[#EBF3FF] text-[#1877F2]',
  google:   'bg-[#FEECEB] text-[#EA4335]',
  tiktok:   'bg-[#F0F0F0] text-[#010101]',
};

const sizes: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ variant = 'default', size = 'md', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: 'meta' | 'google' | 'tiktok' }) {
  const labels = { meta: 'Meta', google: 'Google', tiktok: 'TikTok' };
  const variants_map = { meta: 'meta', google: 'google', tiktok: 'tiktok' } as const;
  return <Badge variant={variants_map[channel]}>{labels[channel]}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    ACTIVE:  { label: 'Activo',    variant: 'success' },
    PAUSED:  { label: 'Pausado',   variant: 'warning' },
    DELETED: { label: 'Eliminado', variant: 'danger'  },
    ENDED:   { label: 'Finalizado', variant: 'default' },
  };
  const cfg = map[status?.toUpperCase()] ?? { label: status, variant: 'default' as Variant };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}
