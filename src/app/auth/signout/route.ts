import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

async function signout(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('demo_role');

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
}

export async function POST(request: NextRequest) {
  return signout(request);
}

export async function GET(request: NextRequest) {
  return signout(request);
}
