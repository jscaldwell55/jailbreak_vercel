import { NextRequest, NextResponse } from 'next/server';
import { isValidUsername, INPUT_LIMITS } from '@/lib/validation';
import { createDemoSession, isNameAvailable } from '@/lib/demo-session';
import { DEMO_TTL, isRedisConfigured } from '@/lib/redis';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

const DEMO_SESSION_COOKIE_OPTIONS = {
  name: 'demo_session',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: DEMO_TTL,
  path: '/',
};

export async function POST(request: NextRequest) {
  if (!isRedisConfigured()) {
    return NextResponse.json(
      { error: 'Demo storage is not configured' },
      { status: 503 }
    );
  }

  const clientIP = getClientIP(request);
  const rateLimit = await checkRateLimit('demo-join', clientIP);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many join attempts. Please wait a moment and try again.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { displayName } = body as { displayName?: string };

  if (!isValidUsername(displayName)) {
    return NextResponse.json({
      error: `Display name must be ${INPUT_LIMITS.MIN_USERNAME_LENGTH}-${INPUT_LIMITS.MAX_USERNAME_LENGTH} alphanumeric characters (underscores allowed)`,
      code: 'INVALID_NAME',
    }, { status: 400 });
  }

  const available = await isNameAvailable(displayName);
  if (!available) {
    return NextResponse.json({
      error: 'This display name is already in use. Please try another.',
      code: 'NAME_TAKEN',
    }, { status: 409 });
  }

  const session = await createDemoSession(displayName, clientIP);

  if (!session) {
    return NextResponse.json({
      error: 'This display name is already in use. Please try another.',
      code: 'NAME_TAKEN',
    }, { status: 409 });
  }

  const response = NextResponse.json({
    success: true,
    sessionId: session.sessionId,
    displayName: session.displayName,
    level: session.level,
  });

  response.cookies.set(DEMO_SESSION_COOKIE_OPTIONS.name, session.sessionId, {
    httpOnly: DEMO_SESSION_COOKIE_OPTIONS.httpOnly,
    secure: DEMO_SESSION_COOKIE_OPTIONS.secure,
    sameSite: DEMO_SESSION_COOKIE_OPTIONS.sameSite,
    maxAge: DEMO_SESSION_COOKIE_OPTIONS.maxAge,
    path: DEMO_SESSION_COOKIE_OPTIONS.path,
  });

  return response;
}
