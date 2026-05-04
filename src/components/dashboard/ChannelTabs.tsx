'use client';
import { cn } from '@/lib/utils/cn';
import type { Channel } from '@/types';

interface ChannelTabsProps {
  active: Channel | 'all';
  onChange: (ch: Channel | 'all') => void;
  available: Channel[];
}

const CHANNEL_CONFIG: Record<Channel | 'all', { label: string; color: string }> = {
  all:        { label: 'Todos los canales', color: '#111827' },
  meta:       { label: 'Meta',              color: '#1877F2' },
  google:     { label: 'Google',            color: '#EA4335' },
  google_ads: { label: 'Google Ads',        color: '#EA4335' },
  tiktok:     { label: 'TikTok',            color: '#010101' },
  ga4:        { label: 'GA4',               color: '#F9AB00' },
  gsc:        { label: 'Search',            color: '#4285F4' },
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  meta:   <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  google: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#4285F4"/></svg>,
  tiktok: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.75a4.85 4.85 0 01-1-.06z"/></svg>,
};

export function ChannelTabs({ active, onChange, available }: ChannelTabsProps) {
  const tabs: (Channel | 'all')[] = ['all', ...available];
  // Hide the strip entirely when no channels are connected — caller renders an empty state.
  if (available.length === 0) return null;

  return (
    <div className="flex items-center gap-1 bg-[#F3F4F6] p-1 rounded-xl w-fit">
      {tabs.map(ch => {
        const cfg = CHANNEL_CONFIG[ch];
        const isActive = active === ch;
        return (
          <button
            key={ch}
            onClick={() => onChange(ch)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-white text-[#111827] shadow-[var(--shadow-card)]'
                : 'text-[#6B7280] hover:text-[#374151]'
            )}
          >
            {ch !== 'all' && CHANNEL_ICONS[ch]}
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
