import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params;
  const body = await request.json().catch(() => ({}));
  const { clientId } = body;

  // In production: validate cron secret, fetch credentials, call channel API
  console.log(`[sync] Triggered sync for channel=${channel} client=${clientId}`);

  return NextResponse.json({
    status: 'queued',
    channel,
    clientId,
    message: `Sync job for ${channel} queued. Check sync_logs for progress.`
  });
}
