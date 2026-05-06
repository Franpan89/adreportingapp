import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/auth';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY no configurada en el servidor.' },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const { system, user: userMessage, model = 'claude-sonnet-4-6', max_tokens = 6000 } = body as {
    system: string;
    user: string;
    model?: string;
    max_tokens?: number;
  };

  if (!system || !userMessage) {
    return NextResponse.json({ error: 'system y user son requeridos' }, { status: 400 });
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? 'Error de API Anthropic' },
      { status: res.status },
    );
  }

  return NextResponse.json({ text: data.content?.[0]?.text ?? '' });
}
