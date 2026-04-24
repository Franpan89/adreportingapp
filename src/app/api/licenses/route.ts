import { NextRequest, NextResponse } from 'next/server';
import { createLicense } from '@/lib/supabase/licenses';
import type { PlanId } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agency_name, agency_email, plan_id, temp_password, expires_at, notes } = body;

    if (!agency_name || !agency_email || !plan_id || !temp_password) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const license = await createLicense({
      agency_name,
      agency_email,
      plan_id: plan_id as PlanId,
      temp_password,
      expires_at: expires_at || null,
      notes: notes || null,
    });

    return NextResponse.json({ license }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
