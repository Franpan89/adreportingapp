'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { CredentialsForm } from '@/components/admin/CredentialsForm';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { Channel } from '@/types';

const CHANNEL_CONFIG: { channel: Channel; label: string; icon: string; color: string }[] = [
  { channel: 'meta',   label: 'Meta Ads',   icon: 'M', color: '#1877F2' },
  { channel: 'google', label: 'Google Ads', icon: 'G', color: '#EA4335' },
  { channel: 'tiktok', label: 'TikTok Ads', icon: 'T', color: '#010101' },
];

const HOW_TO: Record<Channel, { steps: string[]; links: { label: string; url: string }[] }> = {
  meta: {
    steps: [
      'Ve a business.facebook.com → Configuración del negocio.',
      'En "Usuarios" → "Usuarios del sistema", crea un usuario de sistema con rol Admin.',
      'Genera un token de acceso con permisos: ads_read, ads_management, business_management.',
      'En "Cuentas publicitarias", copia el Ad Account ID (formato: act_XXXXXXXXX).',
      'Pega el App ID, App Secret y Access Token en el formulario.',
    ],
    links: [
      { label: 'Meta Business Manager', url: 'https://business.facebook.com' },
      { label: 'Explorador de la API Graph', url: 'https://developers.facebook.com/tools/explorer' },
    ],
  },
  google: {
    steps: [
      'Ingresa a Google Ads → Herramientas → Centro de la API.',
      'Acepta los Términos del Servicio de la API si aún no lo hiciste.',
      'Crea credenciales OAuth2 en console.cloud.google.com (tipo: Aplicación de escritorio).',
      'Descarga el client_secret.json y obtén el Refresh Token usando el flujo OAuth.',
      'En Google Ads, ve a Administrador de la cuenta y copia el Customer ID (formato: XXX-XXX-XXXX).',
      'Pega el Developer Token, Client ID, Client Secret, Refresh Token y Customer ID.',
    ],
    links: [
      { label: 'Google Ads API Center', url: 'https://ads.google.com/aw/apicenter' },
      { label: 'Google Cloud Console', url: 'https://console.cloud.google.com' },
    ],
  },
  tiktok: {
    steps: [
      'Ve a business.tiktok.com/portal/apps y crea una app de marketing.',
      'En la configuración de la app, copia el App ID y App Secret.',
      'Genera un Access Token de larga duración desde la sección "Auth".',
      'En TikTok Ads Manager, copia el Advertiser ID desde la URL de tu cuenta.',
      'Pega el App ID, App Secret, Access Token y Advertiser ID en el formulario.',
    ],
    links: [
      { label: 'TikTok Business Center', url: 'https://business.tiktok.com' },
      { label: 'TikTok for Business Developers', url: 'https://business-api.tiktok.com' },
    ],
  },
};

interface Props {
  clientId: string;
  clientName: string;
  channels: Channel[];
  syncStatus: Record<string, string>;
}

export default function CredentialsClient({ clientId, clientName, channels, syncStatus }: Props) {
  const [activeChannel, setActiveChannel] = useState<Channel>('meta');
  const [howToOpen, setHowToOpen] = useState(false);
  const howTo = HOW_TO[activeChannel];

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <Link href={`/admin/clients/${clientId}`} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a {clientName}
        </Link>
        <h1 className="text-xl font-bold text-[#111827] font-[Oswald] tracking-wide">Credenciales API</h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">
          Conecta los canales publicitarios de {clientName}. Las credenciales se cifran en reposo.
        </p>
      </div>

      <div className="flex-1 px-6 py-5 max-w-2xl">
        <div className="flex gap-2 mb-5">
          {CHANNEL_CONFIG.map(({ channel, label, icon, color }) => {
            const isConnected = channels.includes(channel);
            return (
              <button
                key={channel}
                onClick={() => setActiveChannel(channel)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150',
                  activeChannel === channel
                    ? 'bg-[#111827] text-white border-[#111827] shadow-[2px_3px_0px_rgba(0,0,0,0.15)]'
                    : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#D1D5DB]'
                )}
              >
                <span
                  className="w-5 h-5 rounded text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ background: color }}
                >
                  {icon}
                </span>
                {label}
                {isConnected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] ml-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* How-to panel */}
        <div className="mb-4 border border-[#E5E7EB] rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setHowToOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors text-left"
          >
            <span className="text-sm font-medium text-[#374151]">
              ¿Cómo obtener las credenciales de {CHANNEL_CONFIG.find(c => c.channel === activeChannel)?.label}?
            </span>
            {howToOpen ? <ChevronUp className="w-4 h-4 text-[#6B7280]" /> : <ChevronDown className="w-4 h-4 text-[#6B7280]" />}
          </button>
          {howToOpen && (
            <div className="px-4 py-4 bg-white border-t border-[#E5E7EB] space-y-3">
              <ol className="space-y-2">
                {howTo.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[#374151]">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E5E7EB] text-[#6B7280] text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-2 pt-1">
                {howTo.links.map(link => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#00BD7D] hover:underline"
                  >
                    {link.label} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Credenciales de {CHANNEL_CONFIG.find(c => c.channel === activeChannel)?.label}
            </CardTitle>
          </CardHeader>
          <CredentialsForm
            clientId={clientId}
            channel={activeChannel}
            existingStatus={(syncStatus as Record<string, 'idle' | 'success' | 'error'>)?.[activeChannel] ?? null}
          />
        </Card>
      </div>
    </div>
  );
}
