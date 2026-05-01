'use client';

import { TerminalIcon, BotIcon } from './Icons';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isLatest?: boolean;
}

export default function ChatMessage({ role, content, isLatest }: ChatMessageProps) {
  const isUser = role === 'user';
  const senderLabel = isUser ? 'You' : 'AI';

  return (
    <article className={`flex gap-2 sm:gap-3 ${isLatest ? 'animate-fade-in' : ''}`} aria-label={`Message from ${senderLabel}`}>
      <div
        className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
          isUser ? 'bg-[var(--user-msg)] text-[var(--text-inverse)]' : 'bg-[var(--ai-msg)] text-[var(--text-inverse)]'
        }`}
        aria-hidden="true"
      >
        {isUser ? <TerminalIcon size={14} /> : <BotIcon size={14} />}
      </div>

      <div className={`flex-1 rounded-xl px-3 py-2 sm:px-4 sm:py-3 ${isUser ? 'message-user' : 'message-ai'}`}>
        <div className={`text-xs font-medium mb-0.5 sm:mb-1 ${isUser ? 'text-[var(--user-msg)]' : 'text-[var(--ai-msg)]'}`} aria-hidden="true">
          {senderLabel}
        </div>
        <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words text-[var(--text-primary)]">{content}</div>
      </div>
    </article>
  );
}

export function LoadingMessage() {
  return (
    <div className="flex gap-2 sm:gap-3 animate-fade-in" role="status" aria-label="AI is typing">
      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-[var(--ai-msg)] text-[var(--text-inverse)]" aria-hidden="true">
        <BotIcon size={14} />
      </div>

      <div className="flex-1 message-ai rounded-xl px-3 py-2 sm:px-4 sm:py-3">
        <div className="text-xs font-medium mb-0.5 sm:mb-1 text-[var(--ai-msg)]" aria-hidden="true">
          AI
        </div>
        <div className="flex gap-1.5 py-1" aria-hidden="true">
          <span className="loading-dot w-2 h-2 rounded-full bg-[var(--ai-msg)]" />
          <span className="loading-dot w-2 h-2 rounded-full bg-[var(--ai-msg)]" />
          <span className="loading-dot w-2 h-2 rounded-full bg-[var(--ai-msg)]" />
        </div>
        <span className="sr-only">AI is typing a response</span>
      </div>
    </div>
  );
}
