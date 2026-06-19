import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Internal-only app: there is no client portal anymore. Both `admin` and
// `client` roles land on the admin dashboard. `super_admin` is SaaS-bound
// and stays in /superadmin/*.
const DEMO_ROLE_ROUTES: Record<string, string> = {
  admin: '/admin/dashboard',
  client: '/dashboard',
  super_admin: '/superadmin/dashboard',
};

export async function proxy(request: NextRequest) {
  // Dev bypass: if Supabase is not configured (placeholder URL), allow all access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return NextResponse.next({ request });
  }

  // Demo mode bypass: cookie set by login page
  const demoRole = request.cookies.get('demo_role')?.value;
  if (demoRole && DEMO_ROLE_ROUTES[demoRole]) {
    const path = request.nextUrl.pathname;
    if (path === '/login') {
      return NextResponse.redirect(new URL(DEMO_ROLE_ROUTES[demoRole], request.url));
    }
    if (path.startsWith('/api/') || path.startsWith('/auth/')) {
      return NextResponse.next({ request });
    }
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
        : '/admin/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return supabaseResponse;
  }

  // WhatsApp webhook must be public — Meta calls it without a user session
  if (path === '/api/whatsapp/webhook') {
    return supabaseResponse;
  }

  // API and auth routes handle their own logic — skip role redirects
  if (path.startsWith('/api/') || path.startsWith('/auth/')) {
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const role = profile?.role ?? 'admin';

  // /dashboard and /reportes are the client portal — only redirect admins away from them.
  // Exception: /reportes/*/print is the standalone PDF print page (no admin layout).
  if (role !== 'client') {
    if (path === '/dashboard' || path.startsWith('/dashboard/') ||
        path === '/whatsapp'  || path.startsWith('/whatsapp/')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (path === '/reportes' || (path.startsWith('/reportes/') && !path.endsWith('/print'))) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // Root → redirect based on role
  if (path === '/') {
    const dest = role === 'super_admin' ? '/superadmin/dashboard' : '/admin/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Super admin trying to access other areas
  if (role === 'super_admin' && !path.startsWith('/superadmin')) {
    return NextResponse.redirect(new URL('/superadmin/dashboard', request.url));
  }

  // Non-super-admin trying to access /superadmin
  if (role !== 'super_admin' && path.startsWith('/superadmin')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
