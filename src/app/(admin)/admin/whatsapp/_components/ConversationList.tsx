'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Conversation {
  id: string;
  phone_number_id: string;
  last_message_at: string | null;
  last_message_text: string | null;
  unread_count: number;
  cr_whatsapp_contacts: {
    id: string;
    wa_id: string;
    display_name: string | null;
  };
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  search: string;
  onSearch: (v: string) => void;
  onSelect: (conv: Conversation) => void;
  loading: boolean;
}

export function ConversationList({
  conversations, selectedId, search, onSearch, onSelect, loading,
}: ConversationListProps) {
  const filtered = conversations.filter(c => {
    const name = c.cr_whatsapp_contacts.display_name ?? c.cr_whatsapp_contacts.wa_id;
    return name.toLowerCase().includes(search.toLowerCase()) ||
           c.cr_whatsapp_contacts.wa_id.includes(search);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-[#d1cec9]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9099]" />
          <input
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Buscar contacto…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-[#d8d5d0] neu-inset-sm
                       text-[#1E2938] placeholder-[#8a9099] outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#006666]/30 border-t-[#006666] rounded-full animate-spin" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-sm text-[#8a9099] py-8">
            {search ? 'Sin resultados' : 'Sin conversaciones'}
          </p>
        )}
        {filtered.map(conv => {
          const contact = conv.cr_whatsapp_contacts;
          const name    = contact.display_name ?? contact.wa_id;
          const active  = conv.id === selectedId;
          const time    = conv.last_message_at
            ? formatTime(conv.last_message_at)
            : '';

          return (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelect(conv)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[#d1cec9]/50',
                active ? 'bg-[#d1cec9] neu-inset-sm' : 'hover:bg-[#dedad6]',
              )}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-[#006666] flex items-center justify-center
                              text-white font-bold text-sm shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-semibold text-[#1E2938] truncate">{name}</span>
                  <span className="text-[10px] text-[#8a9099] shrink-0">{time}</span>
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="text-xs text-[#5a6472] truncate">
                    {conv.last_message_text ?? '…'}
                  </span>
                  {conv.unread_count > 0 && (
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#006666] flex items-center
                                     justify-center text-[10px] text-white font-bold">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'ahora';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604_800_000) return d.toLocaleDateString('es-MX', { weekday: 'short' });
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}
