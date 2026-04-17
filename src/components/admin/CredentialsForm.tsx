'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import type { Channel } from '@/types';

interface ChannelCredentialFields {
  meta: { access_token: string; account_id: string; app_id: string; app_secret: string };
  google: { developer_token: string; client_id: string; client_secret: string; refresh_token: string; customer_id: string };
  tiktok: { access_token: string; advertiser_id: string };
}

const CHANNEL_LABELS: Record<Channel, string> = {
  meta:   'Meta Ads',
  google: 'Google Ads',
  tiktok: 'TikTok Ads',
};

const CHANNEL_FIELDS: Record<Channel, { key: string; label: string; placeholder: string; secret?: boolean }[]> = {
  meta: [
    { key: 'access_token', label: 'Access Token', placeholder: 'EAAxxxxxx…', secret: true },
    { key: 'account_id',   label: 'Ad Account ID', placeholder: 'act_123456789' },
    { key: 'app_id',       label: 'App ID', placeholder: '1234567890' },
    { key: 'app_secret',   label: 'App Secret', placeholder: 'abc123…', secret: true },
  ],
  google: [
    { key: 'developer_token', label: 'Developer Token', placeholder: 'ABcde…', secret: true },
    { key: 'client_id',       label: 'OAuth Client ID', placeholder: 'xxxx.apps.googleusercontent.com' },
    { key: 'client_secret',   label: 'OAuth Client Secret', placeholder: 'GOCSPX-…', secret: true },
    { key: 'refresh_token',   label: 'Refresh Token', placeholder: '1//xxx…', secret: true },
    { key: 'customer_id',     label: 'Customer ID', placeholder: '123-456-7890' },
  ],
  tiktok: [
    { key: 'access_token',   label: 'Access Token', placeholder: 'xxxxxx…', secret: true },
    { key: 'advertiser_id',  label: 'Advertiser ID', placeholder: '7012345678901234567' },
  ],
};

interface CredentialsFormProps {
  clientId: string;
  channel: Channel;
  existingStatus?: 'idle' | 'success' | 'error' | null;
  lastSynced?: string | null;
}

export function CredentialsForm({ clientId, channel, existingStatus, lastSynced }: CredentialsFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [saved, setSaved] = useState(false);

  const fields = CHANNEL_FIELDS[channel];

  function handleChange(key: string, value: string) {
    setValues(prev => ({ ...prev, [key]: value }));
    setTestResult(null);
    setSaved(false);
  }

  async function handleTest() {
    setTesting(true);
    // Simulate test
    await new Promise(r => setTimeout(r, 1500));
    setTestResult('success');
    setTesting(false);
  }

  async function handleSave() {
    setSaving(true);
    // Simulate save
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-5">
      {/* Status banner */}
      {existingStatus && (
        <div className={cn(
          'flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm',
          existingStatus === 'success' ? 'bg-[#dcfce7] text-[#16A34A]' :
          existingStatus === 'error'   ? 'bg-[#fee2e2] text-[#DC2626]' :
          'bg-[#F3F4F6] text-[#6B7280]'
        )}>
          {existingStatus === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>
            {existingStatus === 'success'
              ? `Connected · Last synced ${lastSynced ? new Date(lastSynced).toLocaleString() : 'never'}`
              : existingStatus === 'error'
              ? 'Connection error — check credentials and retry'
              : 'Not connected'}
          </span>
        </div>
      )}

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(f => (
          <Input
            key={f.key}
            label={f.label}
            type={f.secret ? 'password' : 'text'}
            placeholder={f.placeholder}
            value={values[f.key] ?? ''}
            onChange={e => handleChange(f.key, e.target.value)}
            autoComplete="off"
          />
        ))}
      </div>

      {/* Test result */}
      {testResult && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          testResult === 'success' ? 'bg-[#dcfce7] text-[#16A34A]' : 'bg-[#fee2e2] text-[#DC2626]'
        )}>
          {testResult === 'success'
            ? <><CheckCircle className="w-4 h-4" /> Connection successful</>
            : <><AlertCircle className="w-4 h-4" /> Connection failed — check your credentials</>}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#dcfce7] text-[#16A34A]">
          <CheckCircle className="w-4 h-4" /> Credentials saved securely
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" loading={testing} onClick={handleTest}
          icon={testing ? undefined : <CheckCircle className="w-3.5 h-3.5" />}>
          Test connection
        </Button>
        <Button size="sm" loading={saving} onClick={handleSave}>
          Save credentials
        </Button>
      </div>
    </div>
  );
}
