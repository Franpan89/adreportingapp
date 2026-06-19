-- =====================================================
-- 0025: WhatsApp Business API — messaging tables
-- =====================================================
-- Adds cr_whatsapp_contacts, cr_whatsapp_conversations, cr_whatsapp_messages
-- and extends cr_channel_credentials to accept channel = 'whatsapp'.
--
-- ⚠️ SCHEMA CHANGE — requires review by Fran (fran@webmymoney.com)

BEGIN;

-- ---- Extend channel constraint to include 'whatsapp' ---------------------
ALTER TABLE public.cr_channel_credentials DROP CONSTRAINT IF EXISTS cr_channel_credentials_channel_check;
ALTER TABLE public.cr_channel_credentials
  ADD CONSTRAINT cr_channel_credentials_channel_check
  CHECK (channel IN (
    'meta', 'meta_ads', 'meta_page', 'meta_instagram',
    'google', 'google_ads', 'google_search_console',
    'tiktok', 'tiktok_ads', 'tiktok_organic',
    'ga4', 'gsc',
    'linkedin', 'pinterest', 'youtube',
    'shopify', 'ghl', 'gtm', 'klaviyo', 'yotpo', 'toast', 'email_sms',
    'whatsapp'
  ));

-- ---- cr_whatsapp_contacts ------------------------------------------------
CREATE TABLE public.cr_whatsapp_contacts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid        NOT NULL REFERENCES public.cr_clients(id) ON DELETE CASCADE,
  wa_id         text        NOT NULL,     -- recipient's WhatsApp phone (e.g. "521234567890")
  display_name  text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (client_id, wa_id)
);

-- ---- cr_whatsapp_conversations -------------------------------------------
CREATE TABLE public.cr_whatsapp_conversations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid        NOT NULL REFERENCES public.cr_clients(id) ON DELETE CASCADE,
  contact_id        uuid        NOT NULL REFERENCES public.cr_whatsapp_contacts(id) ON DELETE CASCADE,
  phone_number_id   text        NOT NULL,  -- our WA Business phone_number_id
  last_message_at   timestamptz,
  last_message_text text,
  unread_count      integer     NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE (client_id, contact_id, phone_number_id)
);

-- ---- cr_whatsapp_messages ------------------------------------------------
CREATE TABLE public.cr_whatsapp_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.cr_whatsapp_conversations(id) ON DELETE CASCADE,
  client_id       uuid        NOT NULL REFERENCES public.cr_clients(id) ON DELETE CASCADE,
  wamid           text        UNIQUE,     -- WhatsApp message ID (wamid.xxx)
  direction       text        NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  msg_type        text        NOT NULL CHECK (msg_type IN (
                                'text', 'image', 'document', 'video',
                                'audio', 'sticker', 'location', 'template', 'unsupported'
                              )),
  body            text,                   -- text content or caption
  media_id        text,                   -- WhatsApp media ID (expires)
  media_url       text,                   -- cached download URL (unused in v1)
  media_mime_type text,
  media_filename  text,
  latitude        numeric,
  longitude       numeric,
  status          text        CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message   text,
  wa_timestamp    timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- ---- RLS ---------------------------------------------------------------
ALTER TABLE public.cr_whatsapp_contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cr_whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cr_whatsapp_messages      ENABLE ROW LEVEL SECURITY;

CREATE POLICY cr_whatsapp_contacts_admin ON public.cr_whatsapp_contacts
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY cr_whatsapp_conversations_admin ON public.cr_whatsapp_conversations
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY cr_whatsapp_messages_admin ON public.cr_whatsapp_messages
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Service role bypass (webhook writes without session)
CREATE POLICY cr_whatsapp_contacts_service ON public.cr_whatsapp_contacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY cr_whatsapp_conversations_service ON public.cr_whatsapp_conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY cr_whatsapp_messages_service ON public.cr_whatsapp_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- Indexes -----------------------------------------------------------
CREATE INDEX idx_cr_wa_contacts_client       ON public.cr_whatsapp_contacts(client_id);
CREATE INDEX idx_cr_wa_convs_client          ON public.cr_whatsapp_conversations(client_id);
CREATE INDEX idx_cr_wa_convs_contact         ON public.cr_whatsapp_conversations(contact_id);
CREATE INDEX idx_cr_wa_convs_last_msg        ON public.cr_whatsapp_conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_cr_wa_msgs_conversation     ON public.cr_whatsapp_messages(conversation_id);
CREATE INDEX idx_cr_wa_msgs_wamid            ON public.cr_whatsapp_messages(wamid);
CREATE INDEX idx_cr_wa_msgs_timestamp        ON public.cr_whatsapp_messages(wa_timestamp);

COMMIT;
