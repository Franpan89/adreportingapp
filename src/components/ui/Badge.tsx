import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes } from 'react';
import type { SourceKey } from '@/types';

type StatusVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
type Variant = StatusVariant | SourceKey;
type Size = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
  dot?: boolean;
}

const sourceVariants: Record<SourceKey, string> = {
  meta_ads:              'bg-[#EBF3FF] text-[#1877F2]',
  google_ads:            'bg-[#FEECEB] text-[#EA4335]',
  tiktok_ads:            'bg-[#F0F0F0] text-[#010101]',
  meta_page:             'bg-[#EBF3FF] text-[#1877F2]',
  meta_instagram:        'bg-[#FCE7F3] text-[#C13584]',
  linkedin:              'bg-[#E0F2FE] text-[#0A66C2]',
  pinterest:             'bg-[#FEE2E2] text-[#E60023]',
  tiktok_organic:        'bg-[#F0F0F0] text-[#010101]',
  youtube:               'bg-[#FEE2E2] text-[#FF0000]',
  ga4:                   'bg-[#FEF3CD] text-[#F9AB00]',
  google_search_console: 'bg-[#E8F0FE] text-[#4285F4]',
  shopify:               'bg-[#F1F8E9] text-[#95BF47]',
  ghl:                   'bg-[#E0E7FF] text-[#312E81]',
  klaviyo:               'bg-[#F3E8FF] text-[#7C3AED]',
  yotpo:                 'bg-[#FEF3C7] text-[#D97706]',
  toast:                 'bg-[#FFE4E6] text-[#FB7185]',
  email_sms:             'bg-[#F3F4F6] text-[#6B7280]',
};

const variants: Record<Variant, string> = {
  default:    'bg-[#F1F2F5] text-[#5a6472]',
  primary:    'bg-[#d9ecec] text-[#006666]',
  success:    'bg-[#d6f5e1] text-[#00A63D]',
  warning:    'bg-[#fff0d6] text-[#b86e00]',
  danger:     'bg-[#ffdce4] text-[#c2153f]',
  ...sourceVariants,
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

const SOURCE_LABELS: Record<SourceKey, string> = {
  meta_ads:              'Meta Ads',
  google_ads:            'Google Ads',
  tiktok_ads:            'TikTok Ads',
  meta_page:             'Facebook',
  meta_instagram:        'Instagram',
  linkedin:              'LinkedIn',
  pinterest:             'Pinterest',
  tiktok_organic:        'TikTok',
  youtube:               'YouTube',
  ga4:                   'GA4',
  google_search_console: 'Search Console',
  shopify:               'Shopify',
  ghl:                   'GHL',
  klaviyo:               'Klaviyo',
  yotpo:                 'Yotpo',
  toast:                 'Toast',
  email_sms:             'Email/SMS',
};

export function ChannelBadge({ channel }: { channel: SourceKey }) {
  return <Badge variant={channel}>{SOURCE_LABELS[channel]}</Badge>;
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
