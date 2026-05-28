import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_COOKIE_NAME,
  isAccessGateEnabled,
  isValidAccessToken,
} from '@/lib/access-gate';

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/unlock' ||
    pathname === '/api/access' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/_next/') ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (!isAccessGateEnabled() || isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (await isValidAccessToken(token)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Password required' }, { status: 401 });
  }

  const unlockUrl = request.nextUrl.clone();
  unlockUrl.pathname = '/unlock';
  unlockUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
