'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CredentialsForm } from '@/components/admin/CredentialsForm';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { MOCK_CLIENTS } from '@/lib/reports/mock';
import { cn } from '@/lib/utils/cn';
import type { Channel } from '@/types';

const CHANNEL_CONFIG: { channel: Channel; label: string; icon: string; color: string }[] = [
  { channel: 'meta',   label: 'Meta Ads',    icon: 'M', color: '#1877F2' },
  { channel: 'google', label: 'Google Ads',  icon: 'G', color: '#EA4335' },
  { channel: 'tiktok', label: 'TikTok Ads',  icon: 'T', color: '#010101' },
];

export default function CredentialsPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const client = MOCK_CLIENTS.find(c => c.id === clientId) ?? MOCK_CLIENTS[0];
  const [activeChannel, setActiveChannel] = useState<Channel>('meta');

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <Link href={`/admin/clients/${clientId}`} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {client.name}
        </Link>
        <h1 className="text-xl font-bold text-[#111827] font-[Oswald] tracking-wide">API Credentials</h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">
          Connect ad channels for {client.name}. Credentials are encrypted at rest.
        </p>
      </div>

      <div className="flex-1 px-6 py-5 max-w-2xl">
        {/* Channel tabs */}
        <div className="flex gap-2 mb-5">
          {CHANNEL_CONFIG.map(({ channel, label, icon, color }) => {
            const isConnected = (client.channels as Channel[]).includes(channel);
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

        <Card>
          <CardHeader>
            <CardTitle>
              {CHANNEL_CONFIG.find(c => c.channel === activeChannel)?.label} Credentials
            </CardTitle>
          </CardHeader>
          <CredentialsForm
            clientId={clientId}
            channel={activeChannel}
            existingStatus={(client.sync_status as Record<string, 'idle' | 'success' | 'error'>)?.[activeChannel] ?? null}
          />
        </Card>
      </div>
    </div>
  );
}
