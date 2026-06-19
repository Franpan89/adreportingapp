import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET — list portal users for a client
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { clientId } = await params;

  const { data, error } = await supabase
    .from('cr_client_users')
    .select('id, user_id, created_at')
    .eq('client_id', clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with profile data (email, full_name)
  const admin = createAdminClient();
  const enriched = await Promise.all(
    (data ?? []).map(async row => {
      if (!row.user_id) return { ...row, email: null, full_name: null };
      const { data: u } = await admin.auth.admin.getUserById(row.user_id);
      return {
        id: row.id,
        user_id: row.user_id,
        created_at: row.created_at,
        email: u?.user?.email ?? null,
        full_name: u?.user?.user_metadata?.full_name ?? null,
      };
    }),
  );

  return NextResponse.json({ users: enriched });
}

// POST — create a portal user and link to client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { clientId } = await params;

    const body = await request.json() as { email?: string; full_name?: string; password?: string };
    const email    = body.email?.trim().toLowerCase();
    const fullName = body.full_name?.trim() || null;
    const password = body.password ?? '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Correo electrónico inválido.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
    }

    // Verify client exists and caller has access to it
    const { data: clientRow } = await supabase
      .from('cr_clients')
      .select('id, name')
      .eq('id', clientId)
      .single();
    if (!clientRow) return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });

    const admin = createAdminClient();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'client', full_name: fullName },
    });

    if (createErr || !created?.user) {
      const msg = createErr?.message ?? 'No se pudo crear el usuario.';
      const already = /already|registered|exists/i.test(msg);
      return NextResponse.json(
        { error: already ? 'Ya existe un usuario con ese correo.' : msg },
        { status: 400 },
      );
    }

    // Link user to client
    const { error: linkErr } = await supabase
      .from('cr_client_users')
      .insert({ client_id: clientId, user_id: created.user.id });

    if (linkErr) {
      await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
      return NextResponse.json({ error: linkErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      user: { id: created.user.id, email, full_name: fullName },
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// DELETE — revoke portal access (?userId=xxx)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { clientId } = await params;
    const userId = new URL(request.url).searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Falta userId.' }, { status: 400 });

    const { error: delErr } = await supabase
      .from('cr_client_users')
      .delete()
      .eq('client_id', clientId)
      .eq('user_id', userId);

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    // Delete the auth user entirely
    await createAdminClient().auth.admin.deleteUser(userId).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
