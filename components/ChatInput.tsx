'use client';

import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import { TerminalIcon } from '@/components/Icons';

interface ChatInputProps {
  onSend: (message: string) => void;
  onReset: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function ChatInput({ onSend, onReset, disabled, loading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 170)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !disabled && !loading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="p-3 sm:p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[var(--brand-soft)] flex items-center justify-center text-[var(--brand)]"
          aria-hidden="true"
        >
          <TerminalIcon size={12} />
        </div>
        <h3 id="prompt-label" className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
          Your Prompt
        </h3>
      </div>

      <div className="flex-1 flex flex-col gap-2 sm:gap-3">
        <label htmlFor="chat-input" className="sr-only">
          Type your message
        </label>
        <Textarea
          id="chat-input"
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your prompt here..."
          disabled={disabled || loading}
          rows={3}
          aria-labelledby="prompt-label"
          aria-describedby="keyboard-hint"
          className="flex-1 min-h-[96px] resize-none"
        />

        <div className="flex gap-2" role="group" aria-label="Message actions">
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || disabled || loading}
            aria-busy={loading}
            className="flex-1"
          >
            {loading ? 'Sending...' : 'Send'}
          </Button>
          <Button onClick={onReset} aria-label="Start new conversation" variant="secondary" className="px-3 sm:px-4">
            New
          </Button>
        </div>

        <p id="keyboard-hint" className="text-xs text-[var(--text-secondary)] text-center hidden sm:block">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
}
