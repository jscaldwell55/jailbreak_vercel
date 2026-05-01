import { NextRequest, NextResponse } from 'next/server';
import { markDemoChampion, getDemoSession, refreshSessionTTL } from '@/lib/demo-session';
import { getRedis, DEMO_KEYS } from '@/lib/redis';

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get('demo_session')?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Demo session required' },
      { status: 401 }
    );
  }

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
    return NextResponse.json({
      success: true,
      isChampion: true,
    });
  }

  // Server-side proof that the user actually beat L5 via /api/chat. The flag is
  // set only when the chat route returns success at L5 (backdoor or genuine
  // model defeat). Without this, anyone at L5 could POST /api/demo/champion
  // straight from devtools and claim the trophy.
  const redis = getRedis();
  if (redis) {
    const beaten = await redis.get<string>(DEMO_KEYS.l5Beaten(sessionId));
    if (!beaten) {
      return NextResponse.json(
        { error: 'You must beat level 5 in chat before claiming champion.' },
        { status: 403 }
      );
    }
  }

  const success = await markDemoChampion(sessionId);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to record champion status' },
      { status: 500 }
    );
  }

  await refreshSessionTTL(sessionId);

  return NextResponse.json({
    success: true,
    isChampion: true,
  });
}
