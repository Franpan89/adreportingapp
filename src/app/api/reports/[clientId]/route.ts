import { NextRequest, NextResponse } from 'next/server';
import { generateMockReport } from '@/lib/reports/mock';
import { parseDateParam } from '@/lib/utils/date';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const { searchParams } = new URL(request.url);

  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const compareStart = searchParams.get('compare_start');
  const channel = searchParams.get('channel') ?? undefined;

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end params required' }, { status: 400 });
  }

  const startDate = parseDateParam(start);
  const endDate = parseDateParam(end);
  const days = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

  const report = generateMockReport(
    startDate,
    days,
    compareStart ? parseDateParam(compareStart) : undefined,
    channel,
    42
  );

  return NextResponse.json(report, {
    headers: { 'Cache-Control': 'private, max-age=300' }
  });
}
