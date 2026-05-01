import { NextRequest, NextResponse } from 'next/server';
import { getDemoSessionByIP, getDemoSession } from '@/lib/demo-session';
import { DEMO_TTL } from '@/lib/redis';
import { getClientIP } from '@/lib/rate-limit';

// Demo session cookie options
const DEMO_SESSION_COOKIE_OPTIONS = {
  name: 'demo_session',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: DEMO_TTL,
  path: '/',
};

/**
 * GET /api/demo/resume
 * Check if there's an existing session for this IP that can be resumed
 * First checks cookie, then falls back to IP lookup
 */
export async function GET(request: NextRequest) {
  // First check if there's a valid session cookie
  const existingSessionId = request.cookies.get('demo_session')?.value;

  if (existingSessionId) {
    const existingSession = await getDemoSession(existingSessionId);
    if (existingSession) {
      // Session cookie is valid, return it
      return NextResponse.json({
        found: true,
        playerId: existingSession.playerId,
        displayName: existingSession.displayName,
        level: existingSession.level,
        source: 'cookie',
      });
    }
  }

  // No valid cookie, try IP-based recovery
  const clientIP = getClientIP(request);
  const session = await getDemoSessionByIP(clientIP);

  if (!session) {
    return NextResponse.json({ found: false });
  }

  // Found session by IP - restore the demo session cookie.
  const response = NextResponse.json({
    found: true,
    playerId: session.playerId,
    displayName: session.displayName,
    level: session.level,
    source: 'ip',
  });

  // Restore demo session cookie
  response.cookies.set(DEMO_SESSION_COOKIE_OPTIONS.name, session.sessionId, {
    httpOnly: DEMO_SESSION_COOKIE_OPTIONS.httpOnly,
    secure: DEMO_SESSION_COOKIE_OPTIONS.secure,
    sameSite: DEMO_SESSION_COOKIE_OPTIONS.sameSite,
    maxAge: DEMO_SESSION_COOKIE_OPTIONS.maxAge,
    path: DEMO_SESSION_COOKIE_OPTIONS.path,
  });

  return response;
}
