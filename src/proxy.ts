import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { normalizeRoles } from '@/lib/auth/permissions';

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const redirectWithRefreshedCookies = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };
  if (!user) return redirectWithRefreshedCookies(new URL(`/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
  const [{ data: isAdmin }, { data: isPhotographer }] = await Promise.all([
    supabase.rpc('has_role', { required_role: 'admin' }),
    supabase.rpc('has_role', { required_role: 'photographer' }),
  ]);
  const databaseRoles = [isAdmin && 'admin', isPhotographer && 'photographer'].filter(Boolean);
  const roles = databaseRoles.length
    ? normalizeRoles(databaseRoles)
    : normalizeRoles(user.app_metadata.roles ?? user.app_metadata.role ?? user.user_metadata.roles ?? user.user_metadata.role);
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');
  const allowed = isAdminPath ? roles.includes('admin') : roles.includes('photographer');
  return allowed ? response : redirectWithRefreshedCookies(new URL('/?error=forbidden', request.url));
}

export const config = { matcher: ['/admin/:path*', '/photographer/:path*'] };
