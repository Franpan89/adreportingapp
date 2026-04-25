import { NextResponse } from 'next/server';
import { createReport } from '@/lib/supabase/reports';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { client_id, title, period_start, period_end } = body ?? {};

    if (!client_id || !title || !period_start || !period_end) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const report = await createReport({
      client_id: String(client_id),
      title: String(title),
      period_start: String(period_start),
      period_end: String(period_end),
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al generar el reporte' },
      { status: 500 },
    );
  }
}
