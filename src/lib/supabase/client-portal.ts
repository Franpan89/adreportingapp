import { createClient } from './server';

export interface ClientPortalUser {
  clientId: string;
  clientName: string;
  clientSlug: string;
  clientLogoUrl: string | null;
  clientTimezone: string;
}

/**
 * Returns the client a logged-in `client` role user is linked to via cr_client_users.
 * Returns null if the user has no client assignment (admin visiting /dashboard, etc.).
 */
export async function getClientPortalUser(userId: string): Promise<ClientPortalUser | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('cr_client_users')
    .select(`
      client_id,
      cr_clients ( id, name, slug, logo_url, timezone )
    `)
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (data as any).cr_clients;
  if (!client) return null;

  return {
    clientId:        client.id,
    clientName:      client.name,
    clientSlug:      client.slug,
    clientLogoUrl:   client.logo_url ?? null,
    clientTimezone:  client.timezone ?? 'UTC',
  };
}
