import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAMES, ROLE_HOME_PATH } from '@/lib/auth/constants';

const PUBLIC_PATHS = ['/login'];

function getRoleHome(role: string | undefined): string {
  return ROLE_HOME_PATH[role ?? ''] ?? '/login';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const role = request.cookies.get(AUTH_COOKIE_NAMES.userRole)?.value;

  if (PUBLIC_PATHS.includes(pathname)) {
    if (accessToken && role) {
      return NextResponse.redirect(new URL(getRoleHome(role), request.url));
    }

    return NextResponse.next();
  }

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/doctor') && role !== 'doctor') {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url));
  }

  if (pathname.startsWith('/patient') && role !== 'patient') {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url));
  }

  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
