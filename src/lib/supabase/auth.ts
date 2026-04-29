import { cookies } from 'next/headers';
import { createClient } from './server';

const DEMO_USER_IDS: Record<string, string> = {
  admin: 'demo-admin-user-id',
  client: 'demo-client-user-id',
  super_admin: 'demo-superadmin-user-id',
};

/**
 * Returns { id } for both real Supabase sessions and demo_role cookie sessions.
 * Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<{ id: string } | null> {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get('demo_role')?.value;
  if (demoRole && DEMO_USER_IDS[demoRole]) {
    return { id: DEMO_USER_IDS[demoRole] };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { id: user.id } : null;
}
