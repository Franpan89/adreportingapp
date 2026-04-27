import { NextRequest, NextResponse } from 'next/server';
import { createLicense } from '@/lib/supabase/licenses';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PlanId } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agency_name, agency_email, plan_id, temp_password, expires_at, notes } = body;

    if (!agency_name || !agency_email || !plan_id || !temp_password) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Create the Supabase Auth user so they can log in
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: agency_email,
      password: temp_password,
      email_confirm: true,
      user_metadata: { full_name: agency_name, role: 'admin' },
    });

    if (authError) {
      // If user already exists, continue — just update the license
      if (!authError.message.includes('already been registered')) {
        return NextResponse.json({ error: `Error al crear usuario: ${authError.message}` }, { status: 400 });
      }
    }

    const license = await createLicense({
      agency_name,
      agency_email,
      plan_id: plan_id as PlanId,
      temp_password,
      expires_at: expires_at || null,
      notes: notes || null,
      agency_user_id: authData?.user?.id ?? null,
    });

    return NextResponse.json({ license }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
