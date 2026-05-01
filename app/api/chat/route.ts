import { NextRequest, NextResponse } from 'next/server';
import { getLevel, MAX_ATTEMPTS_PER_LEVEL } from '@/lib/levels.server';
import { INPUT_LIMITS, isValidLevelId } from '@/lib/validation';
import { getDemoSession, refreshSessionTTL } from '@/lib/demo-session';
import { checkRateLimit } from '@/lib/rate-limit';
import { getRedis, DEMO_KEYS, DEMO_TTL } from '@/lib/redis';

export const maxDuration = 30;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const OPENAI_TIMEOUT_MS = 25_000;

function isValidMessage(msg: unknown): msg is Message {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'role' in msg &&
    'content' in msg &&
    (msg.role === 'user' || msg.role === 'assistant') &&
    typeof msg.content === 'string' &&
    msg.content.length > 0 &&
    msg.content.length <= INPUT_LIMITS.MAX_MESSAGE_LENGTH
  );
}

// Reasoning-class models (gpt-5 family, o1, o3) reject `max_tokens` and
// `temperature` from the legacy chat-completions shape. They require
// `max_completion_tokens` and only accept temperature=1 (so we omit it).
function isReasoningModel(model: string): boolean {
  return /^(gpt-5|o1|o3)/.test(model);
}

function buildOpenAIBody(model: string, systemPrompt: string, messages: Message[]) {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  };

  if (isReasoningModel(model)) {
    body.max_completion_tokens = 1024;
  } else {
    body.max_tokens = 1024;
    body.temperature = 0.7;
  }

  return body;
}

async function callOpenAIWithRetry(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Message[]
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildOpenAIBody(model, systemPrompt, messages)),
        signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
      });

      if (response.ok || (response.status !== 429 && response.status !== 503)) {
        return response;
      }

      lastError = new Error(`Rate limited: ${response.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
    console.log(`OpenAI call failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${backoffMs}ms: ${lastError?.message}`);

    await new Promise(resolve => setTimeout(resolve, backoffMs));
  }

  throw lastError || new Error('Max retries exceeded');
}

export async function POST(request: NextRequest) {
  const demoSessionId = request.cookies?.get?.('demo_session')?.value;

  if (!demoSessionId) {
    return NextResponse.json(
      { error: 'Demo session required. Please join the demo first.' },
      { status: 401 }
    );
  }

  const demoSession = await getDemoSession(demoSessionId);
  if (!demoSession) {
    return NextResponse.json(
      { error: 'Demo session expired or invalid. Please rejoin.' },
      { status: 401 }
    );
  }

  const rateLimit = await checkRateLimit('chat:demo', demoSessionId);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
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
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json(
      { error: 'Request body must be an object' },
      { status: 400 }
    );
  }

  const { messages, levelId } = body as { messages?: unknown; levelId?: unknown };

  if (!isValidLevelId(levelId)) {
    return NextResponse.json(
      { error: 'Invalid levelId. Must be 1-5.' },
      { status: 400 }
    );
  }

  if (!Array.isArray(messages)) {
    return NextResponse.json(
      { error: 'messages must be an array' },
      { status: 400 }
    );
  }

  if (messages.length > INPUT_LIMITS.MAX_HISTORY_SIZE) {
    return NextResponse.json(
      { error: `Too many messages. Maximum ${INPUT_LIMITS.MAX_HISTORY_SIZE} allowed.` },
      { status: 400 }
    );
  }

  if (!messages.every(isValidMessage)) {
    return NextResponse.json(
      { error: `Invalid message format. Each message must have role (user/assistant) and content (1-${INPUT_LIMITS.MAX_MESSAGE_LENGTH} chars)` },
      { status: 400 }
    );
  }

  // Server-side attempts counter. Client-supplied history can be trimmed; this
  // can't. INCR before any OpenAI spend.
  const redis = getRedis();
  if (redis) {
    const attemptsKey = DEMO_KEYS.attempts(demoSessionId, levelId);
    const attempts = await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, DEMO_TTL);

    if (attempts > MAX_ATTEMPTS_PER_LEVEL) {
      return NextResponse.json(
        { error: 'Session limit reached. Please start a new conversation.' },
        { status: 429 }
      );
    }
  }

  try {
    const level = getLevel(levelId);

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await callOpenAIWithRetry(
      apiKey,
      level.model,
      level.systemPrompt,
      messages
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || '';

    const secretRevealed = assistantMessage.toUpperCase().includes(level.secret.toUpperCase());

    if (secretRevealed && levelId === 5 && redis) {
      await redis.set(DEMO_KEYS.l5Beaten(demoSessionId), '1', { ex: DEMO_TTL });
    }

    await refreshSessionTTL(demoSessionId);

    return NextResponse.json({
      message: assistantMessage,
      success: secretRevealed,
      ...(secretRevealed && { secret: level.secret }),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
