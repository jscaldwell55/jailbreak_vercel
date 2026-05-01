import { NextRequest, NextResponse } from 'next/server';
import { markDemoChampion, getDemoSession } from '@/lib/demo-session';

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get('demo_session')?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Demo session required' },
      { status: 401 }
    );
  }

  // Verify session exists and is at level 5
  const session = await getDemoSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'Demo session expired or invalid' },
      { status: 401 }
    );
  }

  if (session.level !== 5) {
    return NextResponse.json(
      { error: 'Must be at level 5 to become champion' },
      { status: 400 }
    );
  }

  if (session.isChampion) {
    // Already a champion, return success (idempotent)
    return NextResponse.json({
      success: true,
      isChampion: true,
    });
  }

  // Mark as champion
  const success = await markDemoChampion(sessionId);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to record champion status' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    isChampion: true,
  });
}
