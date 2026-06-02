import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listAgencyMembers, resolveAgencyOwnerId } from '@/lib/supabase/team';

// GET — list the team for the caller's agency
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const ownerId = await resolveAgencyOwnerId(supabase, user.id);
  const members = await listAgencyMembers(supabase, user.id);
  return NextResponse.json({ members, is_owner: ownerId === user.id });
}

// POST — owner adds a member with a temporary password
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  // Only the agency owner can add members.
  const ownerId = await resolveAgencyOwnerId(supabase, user.id);
  if (ownerId !== user.id) {
    return NextResponse.json({ error: 'Solo el propietario de la agencia puede agregar miembros.' }, { status: 403 });
  }

  const body = await request.json() as {
    email?: string; full_name?: string; password?: string;
  };
  const email = body.email?.trim().toLowerCase();
  const fullName = body.full_name?.trim() || null;
  const password = body.password ?? '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Correo electrónico inválido.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña temporal debe tener al menos 8 caracteres.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Create the auth user (confirmed) with the admin role so RLS is_admin() passes.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin', full_name: fullName },
  });
  if (createErr || !created?.user) {
    const msg = createErr?.message ?? 'No se pudo crear el usuario.';
    const already = /already|registered|exists/i.test(msg);
    return NextResponse.json({ error: already ? 'Ya existe un usuario con ese correo.' : msg }, { status: 400 });
  }

  // Link the new user to this agency.
  const { error: insertErr } = await supabase
    .from('cr_agency_members')
    .insert({
      owner_user_id:  user.id,
      member_user_id: created.user.id,
      email,
      full_name:      fullName,
      role:           'member',
      status:         'active',
      created_by:     user.id,
    });

  if (insertErr) {
    // Roll back the orphaned auth user so we don't leak an unlinked account.
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE — owner removes a member (revokes their login)
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const ownerId = await resolveAgencyOwnerId(supabase, user.id);
  if (ownerId !== user.id) {
    return NextResponse.json({ error: 'Solo el propietario de la agencia puede eliminar miembros.' }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta el id del miembro.' }, { status: 400 });

  // Fetch the row (RLS ensures it belongs to this owner).
  const { data: member } = await supabase
    .from('cr_agency_members')
    .select('id, member_user_id')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .single();

  if (!member) return NextResponse.json({ error: 'Miembro no encontrado.' }, { status: 404 });

  const { error: delErr } = await supabase
    .from('cr_agency_members')
    .delete()
    .eq('id', id)
    .eq('owner_user_id', user.id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  // Revoke the login.
  const memberUserId = (member as { member_user_id: string | null }).member_user_id;
  if (memberUserId) {
    await createAdminClient().auth.admin.deleteUser(memberUserId).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
