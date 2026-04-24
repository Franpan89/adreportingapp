import { NextRequest, NextResponse } from 'next/server';
import { updateLicenseStatus, revokeLicense } from '@/lib/supabase/licenses';
import type { LicenseStatus } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/licenses/[id] — change status
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status: LicenseStatus };

    if (!status) {
      return NextResponse.json({ error: 'status requerido' }, { status: 400 });
    }

    await updateLicenseStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/licenses/[id] — revoke
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await revokeLicense(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
