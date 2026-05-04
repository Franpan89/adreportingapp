import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateClientBusinessType } from '@/lib/supabase/clients';
import type { BusinessType } from '@/types';

const VALID: ReadonlySet<BusinessType> = new Set([
  'ecommerce',
  'high_ticket_local',
  'low_ticket_local',
  'b2b',
  'restaurant',
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json().catch(() => null) as { business_type?: unknown } | null;
  if (!body || (body.business_type !== null && typeof body.business_type !== 'string')) {
    return NextResponse.json({ error: 'business_type debe ser string o null' }, { status: 400 });
  }
  const value = body.business_type as BusinessType | null;
  if (value !== null && !VALID.has(value)) {
    return NextResponse.json({ error: `business_type inválido: ${value}` }, { status: 400 });
  }

  try {
    await updateClientBusinessType(clientId, value);
    return NextResponse.json({ ok: true, business_type: value });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
