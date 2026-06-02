import type { SupabaseClient } from '@supabase/supabase-js';

export interface AgencyMember {
  id: string;
  owner_user_id: string;
  member_user_id: string | null;
  email: string;
  full_name: string | null;
  role: 'owner' | 'member';
  status: 'active' | 'invited' | 'disabled';
  created_at: string;
}

/**
 * Resolve which agency (owner user id) a given user belongs to.
 * Members resolve to their owner; everyone else resolves to themselves.
 * Mirrors the SQL public.agency_owner_id() helper for use in app code.
 */
export async function resolveAgencyOwnerId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from('cr_agency_members')
    .select('owner_user_id')
    .eq('member_user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  return (data as { owner_user_id?: string } | null)?.owner_user_id ?? userId;
}

/** List every member of the agency the given user belongs to. */
export async function listAgencyMembers(
  supabase: SupabaseClient,
  userId: string,
): Promise<AgencyMember[]> {
  const ownerId = await resolveAgencyOwnerId(supabase, userId);
  const { data } = await supabase
    .from('cr_agency_members')
    .select('id, owner_user_id, member_user_id, email, full_name, role, status, created_at')
    .eq('owner_user_id', ownerId)
    .order('created_at', { ascending: true });
  return (data as AgencyMember[] | null) ?? [];
}
