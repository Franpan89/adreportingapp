import { NextRequest, NextResponse } from 'next/server';
import { MOCK_CLIENTS } from '@/lib/reports/mock';

export async function GET() {
  return NextResponse.json({ clients: MOCK_CLIENTS });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // In production: validate, save to Supabase
  const newClient = {
    ...body,
    id: crypto.randomUUID(),
    is_active: true,
    created_at: new Date().toISOString(),
    channels: [],
    sync_status: {},
  };
  return NextResponse.json({ client: newClient }, { status: 201 });
}
