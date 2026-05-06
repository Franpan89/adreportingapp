'use client';
import { cn } from '@/lib/utils/cn';
import { Home } from 'lucide-react';
import type { SourceKey } from '@/types';

export type ActiveTab = 'consolidated' | SourceKey;

interface SourceSidebarProps {
  active: ActiveTab;
  onSelect: (tab: ActiveTab) => void;
  /** Sources the client has connected (cr_channel_credentials.is_active = true).
   *  Sidebar only renders entries for these. */
  available: SourceKey[];
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

const SOURCE_COLORS: Record<SourceKey, string> = {
  meta_ads:              '#1877F2',
  google_ads:            '#EA4335',
  tiktok_ads:            '#010101',
  meta_page:             '#1877F2',
  meta_instagram:        '#C13584',
  linkedin:              '#0A66C2',
  pinterest:             '#E60023',
  tiktok_organic:        '#010101',
  youtube:               '#FF0000',
  ga4:                   '#F9AB00',
  google_search_console: '#4285F4',
  shopify:               '#95BF47',
  ghl:                   '#312E81',
  klaviyo:               '#7C3AED',
  yotpo:                 '#D97706',
  toast:                 '#FB7185',
  email_sms:             '#6B7280',
};

/** Single-letter / short token glyph for the icon square. */
const SOURCE_GLYPH: Record<SourceKey, string> = {
  meta_ads:              'f',
  google_ads:            'G',
  tiktok_ads:            'TT',
  meta_page:             'f',
  meta_instagram:        'IG',
  linkedin:              'in',
  pinterest:             'P',
  tiktok_organic:        'TT',
  youtube:               'YT',
  ga4:                   'GA',
  google_search_console: 'SC',
  shopify:               'S',
  ghl:                   'GHL',
  klaviyo:               'K',
  yotpo:                 'Y',
  toast:                 'T',
  email_sms:             '@',
};

function SourceIcon({ source }: { source: SourceKey }) {
  return (
    <span
      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ backgroundColor: SOURCE_COLORS[source] }}
    >
      {SOURCE_GLYPH[source]}
    </span>
  );
}

export function SourceSidebar({ active, onSelect, available }: SourceSidebarProps) {
  return (
    <aside className="w-56 shrink-0 flex flex-col bg-white border-r border-[#E5E7EB]">
      <p className="px-4 pt-4 pb-2 text-[10px] uppercase tracking-wider text-[#9CA3AF] font-medium">
        Vista
      </p>
      <button
        onClick={() => onSelect('consolidated')}
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
          active === 'consolidated'
            ? 'bg-[#00BD7D]/10 text-[#00BD7D] border-l-2 border-[#00BD7D]'
            : 'text-[#374151] hover:bg-[#F9FAFB] border-l-2 border-transparent',
        )}
      >
        <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#00BD7D] text-white shrink-0">
          <Home className="w-3.5 h-3.5" />
        </span>
        Consolidated
      </button>

      {available.length > 0 && (
        <p className="px-4 pt-5 pb-2 text-[10px] uppercase tracking-wider text-[#9CA3AF] font-medium">
          Fuentes ({available.length})
        </p>
      )}

      <div className="flex-1 overflow-y-auto">
        {available.map(source => (
          <button
            key={source}
            onClick={() => onSelect(source)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
              active === source
                ? 'bg-[#F0FDF8] text-[#111827] border-l-2 border-[#00BD7D]'
                : 'text-[#374151] hover:bg-[#F9FAFB] border-l-2 border-transparent',
            )}
          >
            <SourceIcon source={source} />
            <span className="truncate">{SOURCE_LABELS[source]}</span>
          </button>
        ))}
      </div>

      {available.length === 0 && (
        <p className="px-4 py-3 text-xs text-[#9CA3AF] italic">
          Sin fuentes conectadas. Configura credenciales para empezar.
        </p>
      )}
    </aside>
  );
}
