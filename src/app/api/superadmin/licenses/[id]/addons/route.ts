import { NextRequest, NextResponse } from 'next/server';
import { updateLicenseAddons } from '@/lib/supabase/licenses';
import type { LicenseAddons } from '@/types';

interface Params { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const addons = body as LicenseAddons;

  try {
    await updateLicenseAddons(id, addons);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al actualizar add-ons' },
      { status: 500 },
    );
  }
}
