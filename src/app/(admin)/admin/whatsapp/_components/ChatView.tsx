'use client';

import { useEffect, useRef } from 'react';
import { Check, CheckCheck, FileText, Download, MapPin } from 'lucide-react';
import { MessageComposer, type WhatsAppMessage } from './MessageComposer';

interface Conversation {
  id: string;
  phone_number_id: string;
  last_message_at: string | null;
  unread_count: number;
  cr_whatsapp_contacts: {
    id: string;
    wa_id: string;
    display_name: string | null;
  };
}

interface ChatViewProps {
  clientId: string;
  conversation: Conversation;
  messages: WhatsAppMessage[];
  loading: boolean;
  onSent: (msg: WhatsAppMessage) => void;
  isDemo?: boolean;
}

export function ChatView({ clientId, conversation, messages, loading, onSent, isDemo }: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const contact   = conversation.cr_whatsapp_contacts;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#d1cec9] flex items-center gap-3 bg-[#E7E5E4]">
        <div className="w-10 h-10 rounded-full bg-[#006666] flex items-center justify-center text-white font-bold text-sm shrink-0">
          {(contact.display_name ?? contact.wa_id).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#1E2938] text-sm truncate">
            {contact.display_name ?? contact.wa_id}
          </p>
          <p className="text-xs text-[#5a6472]">+{contact.wa_id}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 bg-[#ede9e3]"
           style={{ scrollbarWidth: 'thin' }}>
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#006666]/30 border-t-[#006666] rounded-full animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-[#8a9099] py-8">Sin mensajes aún</p>
        )}
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} clientId={clientId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <MessageComposer
        clientId={clientId}
        conversationId={conversation.id}
        contactWaId={contact.wa_id}
        onSent={onSent}
        isDemo={isDemo}
      />
    </div>
  );
}

function MessageBubble({ msg, clientId }: { msg: WhatsAppMessage; clientId: string }) {
  const outbound = msg.direction === 'outbound';
  const time = msg.wa_timestamp
    ? new Date(msg.wa_timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-sm lg:max-w-md rounded-2xl px-3 py-2 shadow-sm
          ${outbound
            ? 'bg-[#d1f4cc] rounded-tr-sm'
            : 'bg-white rounded-tl-sm'
          }`}
      >
        <MediaContent msg={msg} clientId={clientId} />

        {msg.body && msg.msg_type !== 'location' && (
          <p className="text-sm text-[#1E2938] whitespace-pre-wrap break-words">{msg.body}</p>
        )}
        {msg.msg_type === 'location' && (
          <div className="flex items-center gap-1 text-sm text-[#1E2938]">
            <MapPin className="w-4 h-4 text-[#006666]" />
            <span>{msg.body ?? 'Ubicación compartida'}</span>
          </div>
        )}

        <div className={`flex items-center gap-1 mt-1 ${outbound ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-[#8a9099]">{time}</span>
          {outbound && <StatusIcon status={msg.status} />}
        </div>
      </div>
    </div>
  );
}

function MediaContent({ msg, clientId }: { msg: WhatsAppMessage; clientId: string }) {
  if (!msg.media_id) return null;
  const src = `/api/whatsapp/${clientId}/media/${msg.media_id}`;

  if (msg.msg_type === 'image') {
    return (
      <a href={src} target="_blank" rel="noreferrer" className="block mb-1">
        <img
          src={src}
          alt={msg.media_filename ?? 'imagen'}
          className="rounded-lg max-h-48 object-contain bg-[#d1cec9]"
          loading="lazy"
        />
      </a>
    );
  }

  if (msg.msg_type === 'video') {
    return (
      <video
        src={src}
        controls
        className="rounded-lg max-h-48 w-full mb-1"
      />
    );
  }

  if (msg.msg_type === 'audio') {
    return <audio src={src} controls className="w-full mb-1" />;
  }

  if (msg.msg_type === 'document') {
    return (
      <a
        href={src}
        download={msg.media_filename ?? 'archivo'}
        className="flex items-center gap-2 mb-1 px-2 py-2 rounded-lg bg-[#006666]/10 hover:bg-[#006666]/20 transition-colors"
      >
        <FileText className="w-5 h-5 text-[#006666] shrink-0" />
        <span className="text-xs text-[#1E2938] truncate flex-1">{msg.media_filename ?? 'Documento'}</span>
        <Download className="w-4 h-4 text-[#006666] shrink-0" />
      </a>
    );
  }

  return null;
}

function StatusIcon({ status }: { status: string | null }) {
  if (status === 'read')      return <CheckCheck className="w-3.5 h-3.5 text-[#006666]" />;
  if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-[#8a9099]" />;
  if (status === 'sent')      return <Check      className="w-3.5 h-3.5 text-[#8a9099]" />;
  if (status === 'failed')    return <span className="text-[10px] text-red-500">!</span>;
  return null;
}
