import { NextRequest, NextResponse } from 'next/server';
import { isValidLevelId } from '@/lib/validation';
import { updateDemoLevel, getDemoSession } from '@/lib/demo-session';

export async function PUT(request: NextRequest) {
  const sessionId = request.cookies.get('demo_session')?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Demo session required' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { level } = body as { level?: number };

  // Validate level
  if (!isValidLevelId(level)) {
    return NextResponse.json(
      { error: 'Invalid level. Must be 1-5.' },
      { status: 400 }
    );
  }

  // Verify session exists and get current level
  const session = await getDemoSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'Demo session expired or invalid. Please rejoin.' },
      { status: 401 }
    );
  }

  // Prevent level regression (only allow advancing)
  if (level <= session.level) {
    return NextResponse.json(
      { error: 'Cannot regress to a lower level' },
      { status: 400 }
    );
  }

  const success = await updateDemoLevel(sessionId, level);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    level,
  });
}
