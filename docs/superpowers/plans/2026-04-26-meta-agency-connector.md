# Meta Agency Connector — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admin users connect their Meta Business token once in Settings; when creating a new client, they pick the ad account from a dropdown instead of pasting credentials manually.

**Architecture:** Store an agency-level encrypted Meta access token in a new `agency_meta_connections` table (one row per admin). Client `channel_credentials` stores only the `account_id` (no token). During sync, the route resolves the access token by looking up `agency_meta_connections` if the client credential has no embedded token.

**Tech Stack:** Next.js 15 App Router, Supabase (postgres + RLS), AES-256-GCM encryption (`src/lib/utils/encrypt.ts`), Meta Graph API v21.0, TypeScript strict, Tailwind CSS.

---

## File Map

| Action   | File                                                                           | Purpose                                              |
|----------|--------------------------------------------------------------------------------|------------------------------------------------------|
| Create   | `supabase/migrations/0006_agency_meta_connection.sql`                          | New table + RLS                                      |
| Create   | `src/app/api/agency/meta-connection/route.ts`                                  | GET/POST agency token                                |
| Create   | `src/app/api/agency/meta-connection/accounts/route.ts`                         | Proxy → Meta `/me/adaccounts`                        |
| Create   | `src/components/admin/MetaConnector.tsx`                                       | Settings card UI (connect / disconnect / list)       |
| Modify   | `src/app/(admin)/admin/settings/page.tsx`                                      | Add `<MetaConnector />` card                         |
| Modify   | `src/app/(admin)/admin/clients/new/page.tsx`                                   | Add Meta account dropdown, pass `meta_account_id`    |
| Modify   | `src/app/api/clients/route.ts`                                                 | Accept `meta_account_id`, auto-create credentials    |
| Modify   | `src/app/api/sync/[channel]/route.ts`                                          | Fall back to agency token when credential has no token |
| Modify   | `src/types/index.ts`                                                           | Add `AdAccount` type                                 |

---

## Task 1: Supabase migration — `agency_meta_connections`

**Files:**
- Create: `supabase/migrations/0006_agency_meta_connection.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0006_agency_meta_connection.sql

create table public.agency_meta_connections (
  id               uuid primary key default gen_random_uuid(),
  admin_user_id    uuid not null references auth.users(id) on delete cascade,
  access_token_enc text not null,
  connected_at     timestamptz not null default now(),
  verified_at      timestamptz,
  unique(admin_user_id)
);

-- Only the owner can read/write their row
alter table public.agency_meta_connections enable row level security;

create policy "owner_all" on public.agency_meta_connections
  for all using (auth.uid() = admin_user_id)
  with check (auth.uid() = admin_user_id);
```

- [ ] **Step 2: Apply the migration**

Run in Supabase Dashboard → SQL Editor, or:
```bash
npx supabase db push
```

Verify the table appears in Supabase Dashboard → Table Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0006_agency_meta_connection.sql
git commit -m "[DB] add agency_meta_connections table with RLS"
```

---

## Task 2: Add `AdAccount` type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add type at the end of the file**

```typescript
/* ----- Agency Meta Connection ----- */
export interface AdAccount {
  id: string;          // e.g. "act_123456789"
  name: string;
  account_status: number; // 1 = ACTIVE
  currency: string;
}
```

- [ ] **Step 2: Typecheck**

```bash
cd "C:\Users\Usuario\OneDrive\Documentos\WMM\Report-app" && npx tsc --noEmit 2>&1 | grep -v "^web/"
```

Expected: no new errors (pre-existing errors in `clients.ts` are unrelated).

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "[TYPES] add AdAccount type"
```

---

## Task 3: API — Save / get agency Meta token

**Files:**
- Create: `src/app/api/agency/meta-connection/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
// src/app/api/agency/meta-connection/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@/lib/utils/encrypt';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data } = await supabase
    .from('agency_meta_connections')
    .select('id, connected_at, verified_at, access_token_enc')
    .eq('admin_user_id', user.id)
    .single();

  if (!data) return NextResponse.json({ connected: false });

  // Return a masked token so the UI can show "connected" without exposing the secret
  let tokenPreview = '';
  try {
    const token = decrypt(data.access_token_enc);
    tokenPreview = token.slice(0, 6) + '…' + token.slice(-4);
  } catch {
    tokenPreview = '••••';
  }

  return NextResponse.json({
    connected: true,
    connected_at: data.connected_at,
    verified_at: data.verified_at,
    token_preview: tokenPreview,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { access_token } = body as { access_token?: string };
  if (!access_token?.trim()) {
    return NextResponse.json({ error: 'access_token requerido' }, { status: 400 });
  }

  // Verify the token works before saving
  const verifyRes = await fetch(
    `https://graph.facebook.com/v21.0/me/adaccounts?fields=id&limit=1&access_token=${encodeURIComponent(access_token)}`,
  );
  const verifyData = await verifyRes.json();
  if (verifyData.error) {
    return NextResponse.json(
      { error: `Token inválido: ${verifyData.error.message}` },
      { status: 400 },
    );
  }

  let access_token_enc: string;
  try {
    access_token_enc = encrypt(access_token);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error de cifrado' }, { status: 500 });
  }

  const { error } = await supabase
    .from('agency_meta_connections')
    .upsert(
      {
        admin_user_id: user.id,
        access_token_enc,
        connected_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
      },
      { onConflict: 'admin_user_id' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await supabase
    .from('agency_meta_connections')
    .delete()
    .eq('admin_user_id', user.id);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "^web/"
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/agency/meta-connection/route.ts
git commit -m "[API] agency Meta connection — GET/POST/DELETE"
```

---

## Task 4: API — List ad accounts

**Files:**
- Create: `src/app/api/agency/meta-connection/accounts/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
// src/app/api/agency/meta-connection/accounts/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/utils/encrypt';
import type { AdAccount } from '@/types';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: conn } = await supabase
    .from('agency_meta_connections')
    .select('access_token_enc')
    .eq('admin_user_id', user.id)
    .single();

  if (!conn) return NextResponse.json({ error: 'Meta no conectado' }, { status: 404 });

  let access_token: string;
  try {
    access_token = decrypt(conn.access_token_enc);
  } catch {
    return NextResponse.json({ error: 'No se pudo descifrar el token' }, { status: 500 });
  }

  const params = new URLSearchParams({
    fields: 'id,name,account_status,currency',
    limit: '200',
    access_token,
  });

  const res = await fetch(`https://graph.facebook.com/v21.0/me/adaccounts?${params}`);
  const json = await res.json();

  if (json.error) {
    return NextResponse.json({ error: json.error.message }, { status: 400 });
  }

  const accounts: AdAccount[] = (json.data ?? [])
    .filter((a: AdAccount) => a.account_status === 1)
    .map((a: AdAccount) => ({
      id: a.id,
      name: a.name,
      account_status: a.account_status,
      currency: a.currency,
    }));

  return NextResponse.json({ accounts });
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "^web/"
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/agency/meta-connection/accounts/route.ts
git commit -m "[API] list agency Meta ad accounts"
```

---

## Task 5: Settings UI — MetaConnector component

**Files:**
- Create: `src/components/admin/MetaConnector.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/admin/MetaConnector.tsx
'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Link2, Unlink, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConnectionStatus {
  connected: boolean;
  connected_at?: string;
  token_preview?: string;
}

export function MetaConnector() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/agency/meta-connection')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false }));
  }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/agency/meta-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al conectar');
      setToken('');
      setSuccess(true);
      // Refresh status
      const s = await fetch('/api/agency/meta-connection').then(r => r.json());
      setStatus(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar Meta? Los clientes que usen el token de agencia no podrán sincronizar.')) return;
    setDisconnecting(true);
    await fetch('/api/agency/meta-connection', { method: 'DELETE' });
    setStatus({ connected: false });
    setDisconnecting(false);
  }

  if (status === null) {
    return <div className="h-12 bg-[#F3F4F6] rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      {status.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[#f0fdf4] border border-[#86efac] rounded-lg">
            <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#15803D]">Meta conectado</p>
              {status.connected_at && (
                <p className="text-xs text-[#16A34A]/70">
                  Conectado el {new Date(status.connected_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
            {status.token_preview && (
              <code className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">{status.token_preview}</code>
            )}
          </div>

          <p className="text-xs text-[#6B7280]">
            Al crear un cliente, podrás seleccionar la cuenta publicitaria desde la lista de cuentas accesibles con este token.
          </p>

          <Button
            variant="outline"
            size="sm"
            icon={<Unlink className="w-3.5 h-3.5" />}
            loading={disconnecting}
            onClick={handleDisconnect}
          >
            Desconectar Meta
          </Button>
        </div>
      ) : (
        <form onSubmit={handleConnect} className="space-y-3">
          <p className="text-sm text-[#374151]">
            Pega tu token de acceso de Meta (System User Token o Long-Lived Token) con acceso a las cuentas publicitarias de tu agencia.
          </p>

          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              required
              className="w-full px-3 py-2 pr-10 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2] font-mono"
            />
            <button
              type="button"
              onClick={() => setShowToken(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-[#DC2626] bg-[#fee2e2] border border-[#DC2626]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-[#16A34A] bg-[#dcfce7] border border-[#16A34A]/20 rounded-lg px-3 py-2">
              ✓ Token verificado y guardado correctamente.
            </p>
          )}

          <Button
            type="submit"
            size="sm"
            icon={<Link2 className="w-3.5 h-3.5" />}
            loading={saving}
          >
            {saving ? 'Verificando…' : 'Conectar Meta'}
          </Button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "^web/"
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/MetaConnector.tsx
git commit -m "[UI] MetaConnector component for Settings"
```

---

## Task 6: Settings page — add MetaConnector card

**Files:**
- Modify: `src/app/(admin)/admin/settings/page.tsx`

- [ ] **Step 1: Replace the settings page content**

```tsx
// src/app/(admin)/admin/settings/page.tsx
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetaConnector } from '@/components/admin/MetaConnector';

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-[#111827] font-[Oswald] tracking-wide">Configuración</h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">Configuración general de la agencia</p>
      </div>
      <div className="flex-1 px-6 py-5 max-w-xl space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {/* Meta blue dot */}
              <span className="w-5 h-5 rounded flex items-center justify-center bg-[#1877F2]">
                <span className="text-white text-[10px] font-black leading-none">f</span>
              </span>
              <CardTitle>Conector Meta Ads</CardTitle>
            </div>
          </CardHeader>
          <MetaConnector />
        </Card>

        <Card>
          <CardHeader><CardTitle>Perfil de Agencia</CardTitle></CardHeader>
          <p className="text-sm text-[#6B7280]">Configuración del perfil de agencia próximamente.</p>
        </Card>
        <Card>
          <CardHeader><CardTitle>Programación de Sincronización</CardTitle></CardHeader>
          <p className="text-sm text-[#6B7280]">Configura los intervalos de sincronización automática por cliente.</p>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notificaciones</CardTitle></CardHeader>
          <p className="text-sm text-[#6B7280]">Preferencias de alertas para errores de sincronización y anomalías.</p>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "^web/"
```

Expected: no new errors.

- [ ] **Step 3: Verify in browser**

Open http://localhost:3000/admin/settings. You should see the "Conector Meta Ads" card with the token input form. No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(admin)/admin/settings/page.tsx
git commit -m "[UI] Settings page — add Meta Connector card"
```

---

## Task 7: New client form — Meta account dropdown

**Files:**
- Modify: `src/app/(admin)/admin/clients/new/page.tsx`

- [ ] **Step 1: Replace the new client page**

```tsx
// src/app/(admin)/admin/clients/new/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import type { AdAccount } from '@/types';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', timezone: 'America/New_York' });
  const [metaAccountId, setMetaAccountId] = useState('');
  const [adAccounts, setAdAccounts] = useState<AdAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // Load ad accounts if Meta is connected
  useEffect(() => {
    fetch('/api/agency/meta-connection')
      .then(r => r.json())
      .then(status => {
        if (!status.connected) return;
        return fetch('/api/agency/meta-connection/accounts')
          .then(r => r.json())
          .then(data => setAdAccounts(data.accounts ?? []));
      })
      .catch(() => setAdAccounts([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          meta_account_id: metaAccountId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al crear cliente');
      router.push('/admin/clients');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <Link href="/admin/clients" className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver a clientes
        </Link>
        <h1 className="text-xl font-bold text-[#111827] font-[Oswald] tracking-wide">Agregar nuevo cliente</h1>
      </div>

      <div className="flex-1 px-6 py-5 max-w-lg">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre del cliente"
              value={form.name}
              placeholder="Luxe Cosmetics"
              onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
              required
            />
            <Input
              label="Slug (identificador URL)"
              value={form.slug}
              placeholder="luxe-cosmetics"
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              hint="Se usa en URLs. Minúsculas y guiones únicamente."
              required
            />
            <Input
              label="Zona horaria"
              value={form.timezone}
              onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              placeholder="America/New_York"
            />

            {/* Meta account picker — shown only when Meta is connected */}
            {adAccounts !== null && adAccounts.length > 0 && (
              <label className="block">
                <span className="block text-xs font-medium text-[#374151] mb-1">
                  Cuenta Meta Ads
                  <span className="ml-1 text-[#9CA3AF] font-normal">(opcional)</span>
                </span>
                <select
                  value={metaAccountId}
                  onChange={e => setMetaAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2] bg-white text-[#111827]"
                >
                  <option value="">— Sin cuenta Meta por ahora —</option>
                  {adAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.id}) · {a.currency}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#9CA3AF]">
                  Se vinculará automáticamente al cliente para sincronizar.
                </p>
              </label>
            )}

            {adAccounts !== null && adAccounts.length === 0 && (
              <p className="text-xs text-[#9CA3AF] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2">
                Meta conectado pero sin cuentas activas disponibles.
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="submit" loading={loading}>Crear cliente</Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "^web/"
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(admin)/admin/clients/new/page.tsx
git commit -m "[UI] new client form — Meta account dropdown"
```

---

## Task 8: API — Client creation auto-creates Meta credentials

**Files:**
- Modify: `src/app/api/clients/route.ts`

- [ ] **Step 1: Replace the POST handler**

```typescript
// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getClients, createClient } from '@/lib/supabase/clients';
import { createClient as createSupabase } from '@/lib/supabase/server';
import { encrypt } from '@/lib/utils/encrypt';

export async function GET() {
  const clients = await getClients();
  return NextResponse.json({ clients });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, timezone, meta_account_id } = body as {
      name: string;
      slug: string;
      timezone?: string;
      meta_account_id?: string;
    };

    if (!name || !slug) {
      return NextResponse.json({ error: 'name y slug son requeridos' }, { status: 400 });
    }

    const client = await createClient({ name, slug, timezone });

    // Auto-create Meta credentials when an ad account was selected
    if (meta_account_id) {
      const supabase = await createSupabase();
      let credentials_enc: string;
      try {
        credentials_enc = encrypt(JSON.stringify({ account_id: meta_account_id }));
      } catch (e) {
        // Non-fatal: client was created, credentials can be added later
        console.error('[clients] failed to encrypt meta credentials:', e);
        return NextResponse.json({ client }, { status: 201 });
      }

      await supabase
        .from('channel_credentials')
        .upsert(
          {
            client_id: client.id,
            channel: 'meta',
            credentials_enc,
            is_active: true,
            sync_status: 'idle',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'client_id,channel' },
        );
    }

    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "^web/"
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/clients/route.ts
git commit -m "[API] auto-create Meta credentials on client creation"
```

---

## Task 9: Sync — resolve access token from agency connection

**Files:**
- Modify: `src/app/api/sync/[channel]/route.ts`

The sync route currently throws if `access_token` is missing from the client's credentials. We need to fall back to the agency token stored in `agency_meta_connections`.

- [ ] **Step 1: Add the `resolveMetaToken` helper before `syncMeta`**

Find this block in the file (after the `resolveObjectiveKey` function, before `syncMeta`):

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncMeta(supabase: any, clientId: string, creds: Record<string, string>, since: string, until: string) {
  const { access_token, account_id } = creds;
  if (!access_token || !account_id) throw new Error('Faltan access_token o account_id en las credenciales');
```

Replace with:

```typescript
// Resolves the Meta access token: use the one stored in client credentials if present,
// otherwise fall back to the agency-level token in agency_meta_connections.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveMetaToken(supabase: any, userId: string, clientCreds: Record<string, string>): Promise<string> {
  if (clientCreds.access_token) return clientCreds.access_token;

  const { data } = await supabase
    .from('agency_meta_connections')
    .select('access_token_enc')
    .eq('admin_user_id', userId)
    .single();

  if (!data?.access_token_enc) {
    throw new Error('Sin token de acceso. Configura el Conector Meta en Configuración o añade credenciales al cliente.');
  }

  const { decrypt } = await import('@/lib/utils/encrypt');
  return decrypt(data.access_token_enc);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncMeta(supabase: any, userId: string, clientId: string, creds: Record<string, string>, since: string, until: string) {
  const account_id = creds.account_id;
  if (!account_id) throw new Error('Falta account_id en las credenciales del cliente');

  const access_token = await resolveMetaToken(supabase, userId, creds);
```

- [ ] **Step 2: Update the call site in the POST handler**

Find:
```typescript
    if (channel === 'meta') {
      result = await syncMeta(supabase, clientId, fields, sinceDate, untilDate);
```

Replace with:
```typescript
    if (channel === 'meta') {
      result = await syncMeta(supabase, user.id, clientId, fields, sinceDate, untilDate);
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "^web/"
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/sync/[channel]/route.ts
git commit -m "[SYNC] fall back to agency Meta token when client has no access_token"
```

---

## End-to-end test checklist

- [ ] Go to `/admin/settings` — see Meta Connector card
- [ ] Paste a valid Meta System User Token → click "Conectar Meta" → see success message and connected state with token preview
- [ ] Go to `/admin/clients/new` — see Meta account dropdown populated with your ad accounts
- [ ] Create a new test client with a selected ad account
- [ ] Go to the new client's page → see Meta channel badge active
- [ ] Click Sincronizar → sync completes without error
- [ ] Verify data appears in the dashboard

---

## Self-review notes

- All `encrypt`/`decrypt` calls use the existing `CREDENTIALS_SECRET` env var — no new secrets needed.
- The `resolveMetaToken` function does a lazy import of `decrypt` to avoid issues with top-level module loading in the dynamic import path.
- Client credentials created via the new flow store only `{ account_id }` — no token. Old manually-entered credentials that have `{ access_token, account_id }` continue to work unchanged (backward compatible).
- The DELETE endpoint on agency meta connection is included for the disconnect button; it does NOT cascade-delete client credentials (clients keep their `account_id`, just lose sync ability until a new token is connected).
