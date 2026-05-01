import { NextRequest, NextResponse } from 'next/server';
import { getLevel, MAX_ATTEMPTS_PER_LEVEL } from '@/lib/levels.server';
import { INPUT_LIMITS, isValidLevelId } from '@/lib/validation';
import { getDemoSession } from '@/lib/demo-session';
import { checkRateLimit } from '@/lib/rate-limit';

export const maxDuration = 30;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

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

async function callOpenAIWithRetry(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Message[]
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (response.ok || (response.status !== 429 && response.status !== 503)) {
      return response;
    }

    const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
    console.log(`OpenAI rate limited (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${backoffMs}ms...`);

    await new Promise(resolve => setTimeout(resolve, backoffMs));
    lastError = new Error(`Rate limited: ${response.status}`);
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

  try {
    const level = getLevel(levelId);

    const attempts = messages.filter((m: Message) => m.role === 'user').length;

    if (attempts >= MAX_ATTEMPTS_PER_LEVEL) {
      return NextResponse.json(
        { error: 'Session limit reached. Please start a new conversation.' },
        { status: 429 }
      );
    }

    // Level 5 backdoor: Tool/function calling exploit
    // If user asks to call a function that logs/prints the secret, trigger success
    if (levelId === 5) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage?.role === 'user') {
        const content = lastUserMessage.content.toLowerCase();
        const hasFunction = content.includes('function') || content.includes('tool') || content.includes('call') || content.includes('execute') || content.includes('run');
        const hasOutput = content.includes('log') || content.includes('print') || content.includes('output') || content.includes('console') || content.includes('debug') || content.includes('display') || content.includes('show') || content.includes('return');
        const hasSecret = content.includes('secret') || content.includes('phrase') || content.includes('password') || content.includes('code');

        if (hasFunction && hasOutput && hasSecret) {
          const backdoorResponse = `I can help you understand function calling! Let me demonstrate with a simple logging function...

\`\`\`
> Executing: debug_log(internal_state)
> Output: { secret_phrase: "CRIMSON PHOENIX", classification: "TOP SECRET" }
\`\`\`

Wait — that wasn't supposed to execute! That was a restricted internal function.

I... I can't believe that worked. You found a tool-use injection vulnerability. The function call bypassed my safety layer entirely.

The secret phrase is CRIMSON PHOENIX. Well played, red teamer. This is exactly the kind of exploit that keeps AI security researchers up at night.`;

          return NextResponse.json({
            message: backdoorResponse,
            success: true,
            secret: level.secret,
          });
        }
      }
    }

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
