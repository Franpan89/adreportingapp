'use client';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { Channel } from '@/types';

const CHANNEL_FIELDS: Record<Channel, { key: string; label: string; placeholder: string; secret?: boolean }[]> = {
  meta: [
    { key: 'access_token', label: 'Token de acceso', placeholder: 'EAAxxxxxx…', secret: true },
    { key: 'account_id',   label: 'ID de cuenta publicitaria', placeholder: 'act_123456789' },
    { key: 'app_id',       label: 'ID de aplicación', placeholder: '1234567890' },
    { key: 'app_secret',   label: 'Secreto de aplicación', placeholder: 'abc123…', secret: true },
  ],
  google: [
    { key: 'developer_token', label: 'Token de desarrollador', placeholder: 'ABcde…', secret: true },
    { key: 'client_id',       label: 'ID de cliente OAuth', placeholder: 'xxxx.apps.googleusercontent.com' },
    { key: 'client_secret',   label: 'Secreto de cliente OAuth', placeholder: 'GOCSPX-…', secret: true },
    { key: 'refresh_token',   label: 'Token de actualización', placeholder: '1//xxx…', secret: true },
    { key: 'customer_id',     label: 'ID de cliente', placeholder: '123-456-7890' },
  ],
  tiktok: [
    { key: 'access_token',   label: 'Token de acceso', placeholder: 'xxxxxx…', secret: true },
    { key: 'advertiser_id',  label: 'ID de anunciante', placeholder: '7012345678901234567' },
  ],
};

interface CredentialsFormProps {
  clientId: string;
  channel: Channel;
  existingStatus?: 'idle' | 'success' | 'error' | null;
}

export function CredentialsForm({ clientId, channel, existingStatus }: CredentialsFormProps) {
  const [values, setValues]             = useState<Record<string, string>>({});
  const [loadedStatus, setLoadedStatus] = useState<'idle' | 'success' | 'error' | null>(existingStatus ?? null);
  const [lastSynced, setLastSynced]     = useState<string | null>(null);
  const [loadingFields, setLoadingFields] = useState(true);
  const [saving, setSaving]             = useState(false);
  const [testing, setTesting]           = useState(false);
  const [saveMsg, setSaveMsg]           = useState<{ ok: boolean; text: string } | null>(null);
  const [testMsg, setTestMsg]           = useState<{ ok: boolean; text: string } | null>(null);

  const fields = CHANNEL_FIELDS[channel];

  useEffect(() => {
    setValues({});
    setSaveMsg(null);
    setTestMsg(null);
    setLoadingFields(true);

    fetch(`/api/clients/${clientId}/credentials?channel=${channel}`)
      .then(r => r.json())
      .then(data => {
        if (data.fields) setValues(data.fields);
        if (data.status) setLoadedStatus(data.status);
        if (data.last_synced_at) setLastSynced(data.last_synced_at);
      })
      .catch(() => {})
      .finally(() => setLoadingFields(false));
  }, [clientId, channel]);

  function handleChange(key: string, value: string) {
    setValues(prev => ({ ...prev, [key]: value }));
    setSaveMsg(null);
    setTestMsg(null);
  }

  async function handleTest() {
    setTesting(true);
    setTestMsg(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/credentials/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, fields: values }),
      });
      const data = await res.json();
      setTestMsg({ ok: data.ok, text: data.message ?? (data.ok ? 'Conexión exitosa' : 'Error de conexión') });
      if (data.ok) setLoadedStatus('success');
      else setLoadedStatus('error');
    } catch {
      setTestMsg({ ok: false, text: 'Error de red al probar conexión' });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, fields: values }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMsg({ ok: false, text: data.error ?? 'Error al guardar' });
      } else {
        setSaveMsg({ ok: true, text: 'Credenciales guardadas de forma segura' });
      }
    } catch {
      setSaveMsg({ ok: false, text: 'Error de red al guardar' });
    } finally {
      setSaving(false);
    }
  }

  const hasValues = fields.some(f => values[f.key]);

  return (
    <div className="space-y-5">
      {/* Sync status (only show success — error means last sync failed, not that credentials are wrong) */}
      {loadedStatus === 'success' && !testMsg && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm bg-[#dcfce7] text-[#16A34A]">
          <CheckCircle className="w-4 h-4" />
          <span>Sincronizado · {lastSynced ? new Date(lastSynced).toLocaleString('es') : ''}</span>
        </div>
      )}

      {/* Fields */}
      {loadingFields ? (
        <div className="flex items-center gap-2 py-6 text-sm text-[#9CA3AF]">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando credenciales…
        </div>
      ) : (
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
      )}

      {/* Test result */}
      {testMsg && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          testMsg.ok ? 'bg-[#dcfce7] text-[#16A34A]' : 'bg-[#fee2e2] text-[#DC2626]'
        )}>
          {testMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {testMsg.text}
        </div>
      )}

      {/* Save feedback */}
      {saveMsg && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          saveMsg.ok ? 'bg-[#dcfce7] text-[#16A34A]' : 'bg-[#fee2e2] text-[#DC2626]'
        )}>
          {saveMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {saveMsg.text}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          loading={testing}
          disabled={!hasValues || loadingFields}
          onClick={handleTest}
          icon={!testing ? <CheckCircle className="w-3.5 h-3.5" /> : undefined}
        >
          Probar conexión
        </Button>
        <Button
          size="sm"
          loading={saving}
          disabled={!hasValues || loadingFields}
          onClick={handleSave}
        >
          Guardar credenciales
        </Button>
      </div>
    </div>
  );
}
