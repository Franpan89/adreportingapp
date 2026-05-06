import type { Client, Channel, BusinessType } from '@/types';

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.length > 0 && !url.includes('placeholder') && !url.includes('your-project');
}

async function getSupabase() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

type ClientRow = Client & {
  channels: Channel[];
  sync_status: Record<string, 'idle' | 'syncing' | 'success' | 'error'>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): ClientRow {
  const creds: any[] = row.cr_channel_credentials ?? [];
  const channels = creds.filter(c => c.is_active).map(c => c.channel as Channel);
  const sync_status: Record<string, 'idle' | 'syncing' | 'success' | 'error'> = {};
  creds.forEach(c => { sync_status[c.channel] = c.sync_status ?? 'idle'; });
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo_url: row.logo_url ?? null,
    timezone: row.timezone,
    is_active: row.is_active,
    created_at: row.created_at,
    business_type: (row.business_type as BusinessType | null) ?? null,
    channels,
    sync_status,
  };
}

const SELECT = '*, cr_channel_credentials(channel, sync_status, is_active)';

export async function getClients(): Promise<ClientRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('cr_clients')
    .select(SELECT)
    .order('created_at', { ascending: false });
  if (error || !data) {
    console.error('[clients] getClients error:', error?.message);
    return [];
  }
  return data.map(mapRow);
}

export async function getClientById(id: string): Promise<ClientRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('cr_clients')
    .select(SELECT)
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapRow(data);
}

export async function createClient(input: {
  name: string;
  slug: string;
  timezone?: string;
  logo_url?: string | null;
}): Promise<ClientRow> {
  if (!isSupabaseConfigured()) {
    return {
      id: crypto.randomUUID(),
      name: input.name,
      slug: input.slug,
      logo_url: input.logo_url ?? null,
      timezone: input.timezone ?? 'UTC',
      is_active: true,
      created_at: new Date().toISOString(),
      business_type: null,
      channels: [],
      sync_status: {},
    };
  }
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('cr_clients')
    .insert({ name: input.name, slug: input.slug, timezone: input.timezone ?? 'UTC', logo_url: input.logo_url ?? null })
    .select(SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Error al crear cliente');
  return mapRow(data);
}

export async function updateClientLogo(
  clientId: string,
  logoUrl: string | null,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('cr_clients')
    .update({ logo_url: logoUrl })
    .eq('id', clientId);
  if (error) throw new Error(error.message);
}

export async function updateClientBusinessType(
  clientId: string,
  businessType: BusinessType | null,
): Promise<void> {
  if (!isSupabaseConfigured()) return; // mock mode no-op
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('cr_clients')
    .update({ business_type: businessType })
    .eq('id', clientId);
  if (error) throw new Error(error.message);
}
