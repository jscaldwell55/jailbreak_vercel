import { NextRequest, NextResponse } from 'next/server';
import { removeDemoSession } from '@/lib/demo-session';

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get('demo_session')?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'No demo session to leave' },
      { status: 400 }
    );
  }

  await removeDemoSession(sessionId);

  const response = NextResponse.json({ success: true });

  // Clear demo session cookie
  response.cookies.delete('demo_session');

  return response;
}
