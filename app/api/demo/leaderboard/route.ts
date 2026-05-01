import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/demo-session';
import { isRedisConfigured } from '@/lib/redis';

export async function GET() {
  if (!isRedisConfigured()) {
    console.warn('[Leaderboard] Upstash Redis is not configured; returning empty leaderboard');
    return NextResponse.json(
      { players: [], total: 0, error: 'Leaderboard storage is not configured' },
      { status: 503 }
    );
  }

  const players = await getLeaderboard(50);

  return NextResponse.json({
    players,
    total: players.length,
  });
}
