import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/demo-session';

export async function GET() {
  const players = await getLeaderboard(50);

  return NextResponse.json({
    players,
    total: players.length,
  });
}
