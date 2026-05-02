import { NextRequest, NextResponse } from 'next/server';
import { getDemoSession } from '@/lib/demo-session';

/**
 * GET /api/demo/resume
 * Resume only from the browser's demo session cookie.
 *
 * IP-based recovery is unsafe for live rooms where many attendees share a
 * public NAT address; a fresh browser could otherwise inherit another player's
 * session before choosing a name.
 */
export async function GET(request: NextRequest) {
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

  return NextResponse.json({ found: false });
}
