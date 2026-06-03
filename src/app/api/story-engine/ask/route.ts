import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/auth';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY no configurada en el servidor.' },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const { system, user: userMessage, model = 'anthropic/claude-sonnet-4-6', max_tokens = 6000 } = body as {
    system: string;
    user: string;
    model?: string;
    max_tokens?: number;
  };

  if (!system || !userMessage) {
    return NextResponse.json({ error: 'system y user son requeridos' }, { status: 400 });
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wmm-client-reporting.vercel.app',
      'X-Title': 'wmm-client-reporting',
    },
    body: JSON.stringify({
      model,
      max_tokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? 'Error de OpenRouter' },
      { status: res.status },
    );
  }

  return NextResponse.json({ text: data.choices?.[0]?.message?.content ?? '' });
}
