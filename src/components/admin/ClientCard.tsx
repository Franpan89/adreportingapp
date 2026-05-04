import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatRatio } from '@/lib/utils/format';
import { CheckCircle, AlertCircle, Clock, Loader2, ArrowRight } from 'lucide-react';
import type { Client, Channel } from '@/types';

interface ClientCardProps {
  client: Client & {
    channels?: Channel[];
    sync_status?: Partial<Record<Channel, 'idle' | 'syncing' | 'success' | 'error'>>;
    spend?: number;
    roas?: number;
  };
}

const CHANNEL_COLORS: Record<Channel, string> = {
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

function SyncDot({ status }: { status?: string }) {
  if (status === 'success')  return <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />;
  if (status === 'error')    return <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />;
  if (status === 'syncing')  return <Loader2 className="w-3.5 h-3.5 text-[#D97706] animate-spin" />;
  return <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />;
}

export function ClientCard({ client }: ClientCardProps) {
  const channels = client.channels ?? [];
  const syncStatus = (client.sync_status ?? {}) as Partial<Record<Channel, string>>;

  return (
    <div className={cn(
      'bg-white border border-[#E5E7EB] rounded-xl p-5',
      'shadow-[var(--shadow-perspective-sm)] hover:-translate-y-1 hover:shadow-[var(--shadow-perspective-md)]',
      'transition-all duration-150',
      !client.is_active && 'opacity-60'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar / initials */}
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00BD7D] to-[#00a86e] flex items-center justify-center text-white font-bold text-sm shadow-[2px_3px_0_rgba(0,0,0,0.15)]">
            {client.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-[#111827] text-sm">{client.name}</p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">{client.timezone}</p>
          </div>
        </div>
        <Badge variant={client.is_active ? 'success' : 'default'} size="sm" dot>
          {client.is_active ? 'Activo' : 'Pausado'}
        </Badge>
      </div>

      {/* Mini stats */}
      {(client.spend !== undefined || client.roas !== undefined) && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {client.spend !== undefined && (
            <div className="bg-[#F9FAFB] rounded-lg p-2.5">
              <p className="text-[10px] text-[#9CA3AF]">Inversión 30d</p>
              <p className="text-sm font-bold text-[#111827] mt-0.5">{formatCurrency(client.spend)}</p>
            </div>
          )}
          {client.roas !== undefined && (
            <div className="bg-[#F9FAFB] rounded-lg p-2.5">
              <p className="text-[10px] text-[#9CA3AF]">ROAS</p>
              <p className="text-sm font-bold text-[#111827] mt-0.5">{formatRatio(client.roas)}</p>
            </div>
          )}
        </div>
      )}

      {/* Channel status — only shows the channels this client actually has connected. */}
      {channels.length > 0 ? (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {channels.map(ch => {
            const status = syncStatus[ch];
            return (
              <div key={ch} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: CHANNEL_COLORS[ch] }}
                />
                <SyncDot status={status} />
                <span className="text-[10px] text-[#374151]">
                  {ch.charAt(0).toUpperCase() + ch.slice(1)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] text-[#9CA3AF] mb-4">Sin canales conectados</p>
      )}

      {/* Footer link */}
      <Link
        href={`/admin/clients/${client.id}`}
        className="flex items-center justify-between w-full px-3 py-2 bg-[#F9FAFB] rounded-lg text-xs font-medium text-[#374151] hover:bg-[#F0FDF8] hover:text-[#00BD7D] transition-colors group"
      >
        Ver panel
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
