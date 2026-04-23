import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // Dev bypass: if Supabase is not configured (placeholder URL), allow all access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Public paths
  const publicPaths = ['/login', '/auth/callback'];
  if (publicPaths.some(p => path.startsWith(p))) {
    if (user) {
      // Already logged in — redirect to appropriate dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      const dest = profile?.role === 'super_admin' ? '/superadmin/dashboard'
        : profile?.role === 'admin' ? '/admin/dashboard'
        : '/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return supabaseResponse;
  }

  // Unauthenticated → login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based routing
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role ?? 'client';

  // Root → redirect based on role
  if (path === '/') {
    const dest = role === 'super_admin' ? '/superadmin/dashboard'
      : role === 'admin' ? '/admin/dashboard'
      : '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Super admin trying to access other areas
  if (role === 'super_admin' && !path.startsWith('/superadmin')) {
    return NextResponse.redirect(new URL('/superadmin/dashboard', request.url));
  }

  // Non-super-admin trying to access /superadmin
  if (role !== 'super_admin' && path.startsWith('/superadmin')) {
    const dest = role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Admin trying to access client area (redirect to admin)
  if (role === 'admin' && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Client trying to access admin area
  if (role === 'client' && path.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
