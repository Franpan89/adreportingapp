'use client';

import { useState, useRef, useCallback } from 'react';
import { Smile, Paperclip, Send, X, FileText, Image } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface AttachedFile {
  file: File;
  preview?: string;
  mediaId?: string;
  uploading?: boolean;
  error?: string;
}

interface MessageComposerProps {
  clientId: string;
  conversationId: string;
  contactWaId: string;
  onSent: (msg: WhatsAppMessage) => void;
  disabled?: boolean;
  isDemo?: boolean;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  client_id: string;
  wamid: string | null;
  direction: 'inbound' | 'outbound';
  msg_type: string;
  body: string | null;
  media_id: string | null;
  media_mime_type: string | null;
  media_filename: string | null;
  status: string;
  wa_timestamp: string;
  created_at: string;
}

export function MessageComposer({ clientId, conversationId, contactWaId, onSent, disabled, isDemo }: MessageComposerProps) {
  const [text, setText]             = useState('');
  const [showEmoji, setShowEmoji]   = useState(false);
  const [attached, setAttached]     = useState<AttachedFile | null>(null);
  const [sending, setSending]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const fileRef                     = useRef<HTMLInputElement>(null);
  const textRef                     = useRef<HTMLTextAreaElement>(null);

  const handleAttach = useCallback(async (file: File) => {
    setError(null);
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    setAttached({ file, preview, uploading: true });

    if (isDemo) {
      // Simulate upload in demo mode
      setTimeout(() => {
        setAttached(prev => prev ? { ...prev, mediaId: `demo-media-${Date.now()}`, uploading: false } : null);
      }, 600);
      return;
    }

    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch(`/api/whatsapp/${clientId}/media`, { method: 'POST', body: form });
      const data = await res.json() as { media_id?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? 'Error al subir');
      setAttached(prev => prev ? { ...prev, mediaId: data.media_id, uploading: false } : null);
    } catch (e) {
      setAttached(prev => prev ? { ...prev, uploading: false, error: (e as Error).message } : null);
    }
  }, [clientId, isDemo]);

  const removeAttachment = () => {
    if (attached?.preview) URL.revokeObjectURL(attached.preview);
    setAttached(null);
  };

  const handleSend = async () => {
    if (sending || disabled) return;
    setError(null);

    const hasText   = text.trim().length > 0;
    const hasMedia  = attached && attached.mediaId && !attached.uploading && !attached.error;

    if (!hasText && !hasMedia) return;

    setSending(true);
    try {
      // Demo mode: simulate send without calling the API
      if (isDemo) {
        await new Promise(r => setTimeout(r, 300));
        const now = new Date().toISOString();
        const fakeMsg: WhatsAppMessage = {
          id:              `demo-sent-${Date.now()}`,
          conversation_id: conversationId,
          client_id:       'demo-client-001',
          wamid:           `demo-wamid-${Date.now()}`,
          direction:       'outbound',
          msg_type:        hasMedia && attached ? (attached.file.type.startsWith('image/') ? 'image' : attached.file.type.startsWith('video/') ? 'video' : attached.file.type.startsWith('audio/') ? 'audio' : 'document') : 'text',
          body:            hasText ? text.trim() : (attached?.file.name ?? null),
          media_id:        hasMedia && attached ? attached.mediaId ?? null : null,
          media_mime_type: hasMedia && attached ? attached.file.type : null,
          media_filename:  hasMedia && attached ? attached.file.name : null,
          status:          'sent',
          wa_timestamp:    now,
          created_at:      now,
        };
        onSent(fakeMsg);
        setText('');
        removeAttachment();
        textRef.current?.focus();
        return;
      }

      let body: Record<string, unknown>;

      if (hasMedia && attached) {
        const mimeType  = attached.file.type;
        const mediaType = mimeType.startsWith('image/')   ? 'image'
                        : mimeType.startsWith('video/')   ? 'video'
                        : mimeType.startsWith('audio/')   ? 'audio'
                        : 'document';
        body = {
          conversationId,
          to:       contactWaId,
          type:     mediaType,
          mediaId:  attached.mediaId,
          caption:  text.trim() || undefined,
          filename: attached.file.name,
          mimeType,
        };
      } else {
        body = { conversationId, to: contactWaId, type: 'text', text: text.trim() };
      }

      const res  = await fetch(`/api/whatsapp/${clientId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { message?: WhatsAppMessage; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? 'Error al enviar');

      if (data.message) onSent(data.message);
      setText('');
      removeAttachment();
      textRef.current?.focus();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-[#d1cec9] bg-[#E7E5E4] px-4 py-3">
      {/* Attachment preview */}
      {attached && (
        <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#d8d5d0] text-sm">
          {attached.preview
            ? <img src={attached.preview} alt="" className="h-10 w-10 rounded object-cover" />
            : <FileText className="w-5 h-5 text-[#006666]" />
          }
          <span className="flex-1 truncate text-[#1E2938]">{attached.file.name}</span>
          {attached.uploading && <span className="text-xs text-[#5a6472]">Subiendo…</span>}
          {attached.error    && <span className="text-xs text-red-500">{attached.error}</span>}
          <button type="button" onClick={removeAttachment} className="text-[#5a6472] hover:text-red-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="mb-2 text-xs text-red-500 px-1">{error}</p>
      )}

      <div className="flex items-end gap-2">
        {/* Emoji toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmoji(v => !v)}
            className="neu-pressable w-9 h-9 flex items-center justify-center rounded-lg text-[#5a6472] hover:text-[#006666] transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
          {showEmoji && (
            <EmojiPicker
              onSelect={e => { setText(prev => prev + e); setShowEmoji(false); textRef.current?.focus(); }}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>

        {/* Attach file */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={!!attached}
          className="neu-pressable w-9 h-9 flex items-center justify-center rounded-lg text-[#5a6472] hover:text-[#006666] transition-colors disabled:opacity-40"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          onChange={e => { if (e.target.files?.[0]) { handleAttach(e.target.files[0]); e.target.value = ''; } }}
        />

        {/* Text input */}
        <textarea
          ref={textRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje…"
          rows={1}
          disabled={disabled || sending}
          className="flex-1 resize-none rounded-xl px-4 py-2 text-sm bg-[#d8d5d0] neu-inset-sm
                     text-[#1E2938] placeholder-[#8a9099] outline-none min-h-[40px] max-h-32
                     disabled:opacity-50 transition-all"
          style={{ scrollbarWidth: 'thin' }}
        />

        {/* Send */}
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || disabled || (!text.trim() && !attached?.mediaId)}
          className="neu-pressable w-9 h-9 flex items-center justify-center rounded-lg
                     bg-[#006666] text-white disabled:opacity-40 transition-colors
                     hover:bg-[#00857a]"
        >
          {sending
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ImageIcon = Image; // imported for future use
