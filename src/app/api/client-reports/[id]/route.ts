import { NextRequest, NextResponse } from 'next/server';
import { updateReportStatus, deleteReport } from '@/lib/supabase/reports';
import type { ClientReportStatus } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/client-reports/[id] — change status (draft <-> published)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status: ClientReportStatus };

    if (status !== 'draft' && status !== 'published') {
      return NextResponse.json({ error: 'status inválido' }, { status: 400 });
    }

    await updateReportStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/client-reports/[id]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteReport(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
