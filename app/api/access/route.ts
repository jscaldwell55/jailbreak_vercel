import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  createAccessToken,
  isAccessGateEnabled,
} from '@/lib/access-gate';

export async function POST(request: NextRequest) {
  if (!isAccessGateEnabled()) {
    return NextResponse.json({ ok: true });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const password = typeof body === 'object' && body !== null && 'password' in body
    ? (body as { password?: unknown }).password
    : undefined;

  if (typeof password !== 'string' || password !== process.env.ACCESS_PASSWORD) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const token = await createAccessToken();
  if (!token) {
    return NextResponse.json({ error: 'Access gate unavailable' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
  });

  return response;
}
