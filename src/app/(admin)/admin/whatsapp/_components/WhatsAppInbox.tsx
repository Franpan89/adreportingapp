'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Settings, ChevronDown, X, Eye, EyeOff, FlaskConical } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ConversationList } from './ConversationList';
import { ChatView } from './ChatView';
import type { WhatsAppMessage } from './MessageComposer';
import type { Client } from '@/types';

// ── Demo mode data ─────────────────────────────────────────────────────────────

const DEMO_CLIENT: Client = {
  id: 'demo-client-001',
  name: 'Demo Cliente',
  slug: 'demo-cliente',
  logo_url: null,
  timezone: 'America/Mexico_City',
  is_active: true,
  created_at: new Date().toISOString(),
  business_type: null,
};

const t = (minutesAgo: number) =>
  new Date(Date.now() - minutesAgo * 60_000).toISOString();

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'demo-conv-001',
    phone_number_id: '123456789',
    last_message_at: t(3),
    last_message_text: '¿A qué hora está disponible el doctor?',
    unread_count: 2,
    cr_whatsapp_contacts: { id: 'demo-contact-001', wa_id: '5215512345678', display_name: 'María García' },
  },
  {
    id: 'demo-conv-002',
    phone_number_id: '123456789',
    last_message_at: t(47),
    last_message_text: 'Perfecto, muchas gracias 🙏',
    unread_count: 0,
    cr_whatsapp_contacts: { id: 'demo-contact-002', wa_id: '5215598765432', display_name: 'Carlos Hernández' },
  },
  {
    id: 'demo-conv-003',
    phone_number_id: '123456789',
    last_message_at: t(120),
    last_message_text: 'Les mando la cotización por aquí',
    unread_count: 1,
    cr_whatsapp_contacts: { id: 'demo-contact-003', wa_id: '5215544556677', display_name: 'Ana López' },
  },
  {
    id: 'demo-conv-004',
    phone_number_id: '123456789',
    last_message_at: t(1440),
    last_message_text: 'Ok, hasta mañana',
    unread_count: 0,
    cr_whatsapp_contacts: { id: 'demo-contact-004', wa_id: '5215511223344', display_name: 'Roberto Martínez' },
  },
];

const DEMO_MESSAGES: Record<string, WhatsAppMessage[]> = {
  'demo-conv-001': [
    { id: 'dm-1', conversation_id: 'demo-conv-001', client_id: 'demo-client-001', wamid: 'wamid.1', direction: 'inbound',  msg_type: 'text',     body: 'Hola! Vi su anuncio en Instagram 😊', media_id: null, media_mime_type: null, media_filename: null, status: 'delivered', wa_timestamp: t(65), created_at: t(65) },
    { id: 'dm-2', conversation_id: 'demo-conv-001', client_id: 'demo-client-001', wamid: 'wamid.2', direction: 'outbound', msg_type: 'text',     body: 'Hola María! Claro, con gusto te atendemos 🙌 ¿Qué servicio necesitas?', media_id: null, media_mime_type: null, media_filename: null, status: 'read',      wa_timestamp: t(60), created_at: t(60) },
    { id: 'dm-3', conversation_id: 'demo-conv-001', client_id: 'demo-client-001', wamid: 'wamid.3', direction: 'inbound',  msg_type: 'text',     body: 'Necesito una consulta de ortodoncia', media_id: null, media_mime_type: null, media_filename: null, status: 'delivered', wa_timestamp: t(55), created_at: t(55) },
    { id: 'dm-4', conversation_id: 'demo-conv-001', client_id: 'demo-client-001', wamid: 'wamid.4', direction: 'outbound', msg_type: 'text',     body: 'Perfecto! Tenemos disponibilidad el miércoles a las 10am o el jueves a las 4pm ¿Cuál te acomoda mejor? 📅', media_id: null, media_mime_type: null, media_filename: null, status: 'read',      wa_timestamp: t(50), created_at: t(50) },
    { id: 'dm-5', conversation_id: 'demo-conv-001', client_id: 'demo-client-001', wamid: 'wamid.5', direction: 'inbound',  msg_type: 'text',     body: '¿A qué hora está disponible el doctor?', media_id: null, media_mime_type: null, media_filename: null, status: 'delivered', wa_timestamp: t(3),  created_at: t(3) },
  ],
  'demo-conv-002': [
    { id: 'dm-6',  conversation_id: 'demo-conv-002', client_id: 'demo-client-001', wamid: 'wamid.6',  direction: 'inbound',  msg_type: 'text', body: 'Buenos días! Quiero saber el precio de la limpieza dental', media_id: null, media_mime_type: null, media_filename: null, status: 'delivered', wa_timestamp: t(90),  created_at: t(90) },
    { id: 'dm-7',  conversation_id: 'demo-conv-002', client_id: 'demo-client-001', wamid: 'wamid.7',  direction: 'outbound', msg_type: 'text', body: 'Buenos días Carlos! La limpieza dental tiene un costo de $850 MXN e incluye pulido y aplicación de flúor ✅', media_id: null, media_mime_type: null, media_filename: null, status: 'read',      wa_timestamp: t(85),  created_at: t(85) },
    { id: 'dm-8',  conversation_id: 'demo-conv-002', client_id: 'demo-client-001', wamid: 'wamid.8',  direction: 'inbound',  msg_type: 'text', body: 'Excelente, ¿puedo agendar para este viernes?', media_id: null, media_mime_type: null, media_filename: null, status: 'delivered', wa_timestamp: t(80),  created_at: t(80) },
    { id: 'dm-9',  conversation_id: 'demo-conv-002', client_id: 'demo-client-001', wamid: 'wamid.9',  direction: 'outbound', msg_type: 'text', body: '¡Por supuesto! Tengo disponible a las 11am o 2pm. ¿Cuál prefieres?', media_id: null, media_mime_type: null, media_filename: null, status: 'read',      wa_timestamp: t(75),  created_at: t(75) },
    { id: 'dm-10', conversation_id: 'demo-conv-002', client_id: 'demo-client-001', wamid: 'wamid.10', direction: 'inbound',  msg_type: 'text', body: 'Las 2pm perfecto 👍', media_id: null, media_mime_type: null, media_filename: null, status: 'delivered', wa_timestamp: t(50),  created_at: t(50) },
    { id: 'dm-11', conversation_id: 'demo-conv-002', client_id: 'demo-client-001', wamid: 'wamid.11', direction: 'outbound', msg_type: 'text', body: '¡Listo! Agendado el viernes a las 2pm. Te esperamos 😊 Recuerda llegar 5 min antes.', media_id: null, media_mime_type: null, media_filename: null, status: 'read',      wa_timestamp: t(48),  created_at: t(48) },
    { id: 'dm-12', conversation_id: 'demo-conv-002', client_id: 'demo-client-001', wamid: 'wamid.12', direction: 'inbound',  msg_type: 'text', body: 'Perfecto, muchas gracias 🙏', media_id: null, media_mime_type: null, media_filename: null, status: 'delivered', wa_timestamp: t(47),  created_at: t(47) },
  ],
  'demo-conv-003': [
    { id: 'dm-13', conversation_id: 'demo-conv-003', client_id: 'demo-client-001', wamid: 'wamid.13', direction: 'inbound',  msg_type: 'text', body: 'Hola! Me pueden enviar info de sus servicios y precios?', media_id: null, media_mime_type: null, media_filename: null, status: 'delivered', wa_timestamp: t(180), created_at: t(180) },
    { id: 'dm-14', conversation_id: 'demo-conv-003', client_id: 'demo-client-001', wamid: 'wamid.14', direction: 'outbound', msg_type: 'text', body: 'Hola Ana! Con gusto 😊 Aquí va nuestro catálogo de servicios:', media_id: null, media_mime_type: null, media_filename: null, status: 'read',      wa_timestamp: t(175), created_at: t(175) },
    { id: 'dm-15', conversation_id: 'demo-conv-003', client_id: 'demo-client-001', wamid: 'wamid.15', direction: 'outbound', msg_type: 'document', body: 'Catálogo de servicios 2024', media_id: 'demo-media-001', media_mime_type: 'application/pdf', media_filename: 'catalogo-servicios-2024.pdf', status: 'read', wa_timestamp: t(174), created_at: t(174) },
    { id: 'dm-16', conversation_id: 'demo-conv-003', client_id: 'demo-client-001', wamid: 'wamid.16', direction: 'inbound',  msg_type: 'text', body: 'Muchas gracias! Lo revisaré y les aviso', media_id: null, media_mime_type: null, media_filename: null, status: 'delivered', wa_timestamp: t(130), created_at: t(130) },
    { id: 'dm-17', conversation_id: 'demo-conv-003', client_id: 'demo-client-001', wamid: 'wamid.17', direction: 'inbound',  msg_type: 'text', body: 'Les mando la cotización por aquí', media_id: null, media_mime_type: null, media_filename: null, status: 'delivered', wa_timestamp: t(120), created_at: t(120) },
  ],
  'demo-conv-004': [
    { id: 'dm-18', conversation_id: 'demo-conv-004', client_id: 'demo-client-001', wamid: 'wamid.18', direction: 'inbound',  msg_type: 'text', body: 'Hola, ¿tienen cita mañana a las 9am?', media_id: null, media_mime_type: null, media_filename: null, status: 'delivered', wa_timestamp: t(1500), created_at: t(1500) },
    { id: 'dm-19', conversation_id: 'demo-conv-004', client_id: 'demo-client-001', wamid: 'wamid.19', direction: 'outbound', msg_type: 'text', body: 'Hola Roberto! Mañana a las 9am está ocupado, pero tenemos a las 10:30am ¿te funciona?', media_id: null, media_mime_type: null, media_filename: null, status: 'read',      wa_timestamp: t(1495), created_at: t(1495) },
    { id: 'dm-20', conversation_id: 'demo-conv-004', client_id: 'demo-client-001', wamid: 'wamid.20', direction: 'inbound',  msg_type: 'text', body: 'Sí, está bien', media_id: null, media_mime_type: null, media_filename: null, status: 'delivered', wa_timestamp: t(1460), created_at: t(1460) },
    { id: 'dm-21', conversation_id: 'demo-conv-004', client_id: 'demo-client-001', wamid: 'wamid.21', direction: 'outbound', msg_type: 'text', body: '¡Perfecto! Agendado mañana 10:30am. Hasta mañana 👋', media_id: null, media_mime_type: null, media_filename: null, status: 'read',      wa_timestamp: t(1455), created_at: t(1455) },
    { id: 'dm-22', conversation_id: 'demo-conv-004', client_id: 'demo-client-001', wamid: 'wamid.22', direction: 'inbound',  msg_type: 'text', body: 'Ok, hasta mañana', media_id: null, media_mime_type: null, media_filename: null, status: 'delivered', wa_timestamp: t(1440), created_at: t(1440) },
  ],
};

const DEMO_MODE = true; // active when no real clients loaded

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

interface WhatsAppInboxProps {
  clients: Client[];
}

export function WhatsAppInbox({ clients: rawClients }: WhatsAppInboxProps) {
  const isDemo   = rawClients.length === 0;
  const clients  = isDemo ? [DEMO_CLIENT] : rawClients;

  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id ?? '');
  const [conversations, setConversations]       = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv]         = useState<Conversation | null>(null);
  const [messages, setMessages]                 = useState<WhatsAppMessage[]>([]);
  const [search, setSearch]                     = useState('');
  const [loadingConvs, setLoadingConvs]         = useState(false);
  const [loadingMsgs, setLoadingMsgs]           = useState(false);
  const [showSettings, setShowSettings]         = useState(false);
  const channelRef                              = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async (clientId: string) => {
    if (!clientId) return;
    if (isDemo) { setConversations(DEMO_CONVERSATIONS); return; }
    setLoadingConvs(true);
    try {
      const res  = await fetch(`/api/whatsapp/${clientId}/conversations`);
      const data = await res.json() as { conversations?: Conversation[] };
      setConversations(data.conversations ?? []);
    } finally {
      setLoadingConvs(false);
    }
  }, [isDemo]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (clientId: string, convId: string) => {
    if (isDemo) { setMessages(DEMO_MESSAGES[convId] ?? []); return; }
    setLoadingMsgs(true);
    try {
      const res  = await fetch(`/api/whatsapp/${clientId}/conversations/${convId}/messages`);
      const data = await res.json() as { messages?: WhatsAppMessage[] };
      setMessages(data.messages ?? []);
    } finally {
      setLoadingMsgs(false);
    }
  }, [isDemo]);

  // Load conversations when client changes
  useEffect(() => {
    setSelectedConv(null);
    setMessages([]);
    fetchConversations(selectedClientId);
  }, [selectedClientId, fetchConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConv) fetchMessages(selectedClientId, selectedConv.id);
  }, [selectedConv, selectedClientId, fetchMessages]);

  // Realtime: subscribe to new messages for this client (skipped in demo mode)
  useEffect(() => {
    if (!selectedClientId || isDemo) return;
    const supabase = createClient();

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const ch = supabase
      .channel(`wa-msgs-${selectedClientId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'cr_whatsapp_messages',
          filter: `client_id=eq.${selectedClientId}`,
        },
        (payload) => {
          const msg = payload.new as WhatsAppMessage;
          if (selectedConv && msg.conversation_id === selectedConv.id) {
            setMessages(prev => [...prev, msg]);
          }
          // Refresh conversation list to update last message + unread count
          fetchConversations(selectedClientId);
        },
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'cr_whatsapp_messages',
          filter: `client_id=eq.${selectedClientId}`,
        },
        (payload) => {
          const updated = payload.new as WhatsAppMessage;
          setMessages(prev =>
            prev.map(m => m.id === updated.id ? updated : m)
          );
        },
      )
      .subscribe();

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [selectedClientId, selectedConv, fetchConversations]);

  const handleSent = (msg: WhatsAppMessage) => {
    if (isDemo) {
      // In demo mode, just append the message locally with a fake wamid
      const demo = { ...msg, id: `demo-sent-${Date.now()}`, wamid: `demo-wamid-${Date.now()}`, status: 'sent' };
      setMessages(prev => [...prev, demo]);
      return;
    }
    setMessages(prev => [...prev, msg]);
    fetchConversations(selectedClientId);
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="flex flex-col h-screen bg-[#E7E5E4]">
      {/* Demo mode banner */}
      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs">
          <FlaskConical className="w-3.5 h-3.5 shrink-0" />
          <span><strong>Modo demo</strong> — datos de ejemplo. Conecta tu cuenta de WhatsApp Business para activar el canal en producción.</span>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#d1cec9]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg neu-raised-sm flex items-center justify-center bg-[#006666]">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[#1E2938] text-sm leading-none">WhatsApp</h1>
            <p className="text-[10px] text-[#5a6472] mt-0.5">Bandeja de entrada</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Client selector */}
          <ClientSelector
            clients={clients}
            selectedId={selectedClientId}
            onChange={id => setSelectedClientId(id)}
          />

          {/* Settings */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="neu-pressable w-9 h-9 flex items-center justify-center rounded-lg text-[#5a6472] hover:text-[#006666] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel — conversation list */}
        <div className="w-72 xl:w-80 shrink-0 border-r border-[#d1cec9] flex flex-col">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConv?.id ?? null}
            search={search}
            onSearch={setSearch}
            onSelect={conv => setSelectedConv(conv)}
            loading={loadingConvs}
          />
        </div>

        {/* Right panel — chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConv ? (
            <ChatView
              clientId={selectedClientId}
              conversation={selectedConv}
              messages={messages}
              loading={loadingMsgs}
              onSent={handleSent}
              isDemo={isDemo}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && selectedClient && (
        <SettingsModal
          client={selectedClient}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ClientSelector({ clients, selectedId, onChange }: {
  clients: Client[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const selected = clients.find(c => c.id === selectedId);
  return (
    <div className="relative">
      <select
        value={selectedId}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm neu-inset-sm
                   bg-[#E7E5E4] text-[#1E2938] outline-none cursor-pointer font-medium"
      >
        {clients.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5a6472] pointer-events-none" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-[#ede9e3]">
      <div className="w-16 h-16 rounded-2xl neu-raised flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-[#006666]" />
      </div>
      <h2 className="font-bold text-[#1E2938] mb-2">Selecciona una conversación</h2>
      <p className="text-sm text-[#5a6472] max-w-xs">
        Elige un contacto de la lista para ver los mensajes y responder desde aquí.
      </p>
    </div>
  );
}

function SettingsModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const [phoneNumberId,    setPhoneNumberId]    = useState('');
  const [wabaId,           setWabaId]           = useState('');
  const [accessToken,      setAccessToken]      = useState('');
  const [webhookToken,     setWebhookToken]     = useState('');
  const [showToken,        setShowToken]        = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState<string | null>(null);
  const [success,          setSuccess]          = useState(false);

  // Load existing config
  useEffect(() => {
    fetch(`/api/whatsapp/${client.id}/credentials`)
      .then(r => r.json())
      .then((data: { configured?: boolean; phone_number_id?: string; waba_id?: string }) => {
        if (data.configured) {
          setPhoneNumberId(data.phone_number_id ?? '');
          setWabaId(data.waba_id ?? '');
        }
      })
      .catch(() => { /* ignore */ });
  }, [client.id]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/whatsapp/${client.id}/credentials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number_id: phoneNumberId,
          waba_id:         wabaId,
          access_token:    accessToken,
          webhook_verify_token: webhookToken,
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? 'Error al guardar');
      setSuccess(true);
      setAccessToken(''); // clear token from memory after save
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-[#E7E5E4] rounded-2xl neu-raised p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#1E2938]">Configurar WhatsApp — {client.name}</h2>
          <button type="button" onClick={onClose} className="text-[#5a6472] hover:text-[#1E2938]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Phone Number ID" value={phoneNumberId} onChange={setPhoneNumberId}
                 placeholder="123456789012345" />
          <Field label="WABA ID (WhatsApp Business Account)" value={wabaId} onChange={setWabaId}
                 placeholder="987654321098765" />

          <div>
            <label className="block text-xs font-semibold text-[#5a6472] mb-1.5">
              Access Token <span className="font-normal">(se guarda cifrado, déjalo vacío para no cambiar)</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                placeholder="EAABs…"
                className="w-full px-3 py-2.5 rounded-lg text-sm neu-inset-sm bg-[#E7E5E4] text-[#1E2938] outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9099]"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Field label="Webhook Verify Token (opcional)" value={webhookToken} onChange={setWebhookToken}
                 placeholder="mi_token_secreto" />

          <div className="p-3 rounded-lg bg-[#006666]/10 text-xs text-[#5a6472]">
            <strong className="text-[#006666]">URL del webhook:</strong>{' '}
            <code className="select-all">{typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp/webhook</code>
          </div>

          {error   && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-[#006666] font-semibold">✓ Credenciales guardadas</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="neu-pressable px-4 py-2 rounded-lg text-sm text-[#5a6472]"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !phoneNumberId || !wabaId}
              className="neu-pressable px-4 py-2 rounded-lg text-sm font-semibold
                         bg-[#006666] text-white disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#5a6472] mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg text-sm neu-inset-sm bg-[#E7E5E4] text-[#1E2938] outline-none"
      />
    </div>
  );
}
