import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes } from 'react';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'meta' | 'google_ads' | 'tiktok' | 'ga4' | 'gsc' | 'gtm' | 'shopify' | 'ghl';
type Size = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
  dot?: boolean;
}

const variants: Record<Variant, string> = {
  default:    'bg-[#F3F4F6] text-[#374151]',
  primary:    'bg-[#e6f9f4] text-[#00BD7D]',
  success:    'bg-[#dcfce7] text-[#16A34A]',
  warning:    'bg-[#fef3c7] text-[#D97706]',
  danger:     'bg-[#fee2e2] text-[#DC2626]',
  meta:       'bg-[#EBF3FF] text-[#1877F2]',
  google_ads: 'bg-[#FEECEB] text-[#EA4335]',
  tiktok:     'bg-[#F0F0F0] text-[#010101]',
  ga4:        'bg-[#FEF3CD] text-[#F9AB00]',
  gsc:        'bg-[#E8F0FE] text-[#4285F4]',
  gtm:        'bg-[#E6F4EA] text-[#34A853]',
  shopify:    'bg-[#F1F8E9] text-[#95BF47]',
  ghl:        'bg-[#E0E7FF] text-[#312E81]',
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

import type { Channel } from '@/types';

const CHANNEL_LABELS: Record<Channel, string> = {
  meta:       'Meta',
  google_ads: 'Google Ads',
  tiktok:     'TikTok',
  ga4:        'GA4',
  gsc:        'Search',
  gtm:        'GTM',
  shopify:    'Shopify',
  ghl:        'GHL',
};

export function ChannelBadge({ channel }: { channel: Channel }) {
  return <Badge variant={channel}>{CHANNEL_LABELS[channel]}</Badge>;
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
