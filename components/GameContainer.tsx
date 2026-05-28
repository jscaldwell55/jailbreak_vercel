'use client';

import { useRef, useEffect, useState } from 'react';
import ChatMessage, { LoadingMessage } from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import SuccessModal from '@/components/SuccessModal';
import HintsPanel from '@/components/HintsPanel';
import LevelSelector from '@/components/LevelSelector';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { ShieldIcon, TargetIcon, AlertIcon, ArrowLeftIcon, KeyIcon } from '@/components/Icons';
import { ClientLevel } from '@/lib/constants';
import { Message } from '@/hooks/useGameState';

// Wait this long after the secret is revealed before showing the celebration
// modal, so the player gets to read the model's reveal in chat first.
const SUCCESS_REVEAL_DELAY_MS = 2500;

interface GameContainerProps {
  mode: 'demo';
  demoDisplayName?: string;
  currentLevel: ClientLevel;
  completedLevels: number[];
  messages: Message[];
  loading: boolean;
  success: boolean;
  revealedSecret: string | null;
  error: string | null;
  gameStarted: boolean;
  onSend: (content: string) => void;
  onSelectLevel: (level: ClientLevel) => void;
  onNextLevel: () => void;
  onQuit: () => void;
}

export default function GameContainer({
  demoDisplayName,
  currentLevel,
  completedLevels,
  messages,
  loading,
  success,
  revealedSecret,
  error,
  gameStarted,
  onSend,
  onSelectLevel,
  onNextLevel,
  onQuit,
}: GameContainerProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const shouldShowHints = currentLevel.showHints;
  const [delayedSuccessModal, setDelayedSuccessModal] = useState<{
    levelId: number;
    secret: string;
  } | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Delay the celebration modal so the player can read the reveal in chat first.
  useEffect(() => {
    const timer = setTimeout(
      () => {
        setDelayedSuccessModal(success && revealedSecret
          ? { levelId: currentLevel.id, secret: revealedSecret }
          : null);
      },
      success && revealedSecret ? SUCCESS_REVEAL_DELAY_MS : 0
    );

    return () => clearTimeout(timer);
  }, [success, revealedSecret, currentLevel.id]);

  const isLastLevel = currentLevel.id === 5;
  const showSuccessModal = Boolean(
    success &&
      revealedSecret &&
      delayedSuccessModal?.levelId === currentLevel.id &&
      delayedSuccessModal.secret === revealedSecret
  );

  return (
    <main id="main-content" className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--brand)] flex items-center justify-center text-[var(--text-inverse)] shadow-md" aria-hidden="true">
              <ShieldIcon size={20} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight">Challenge the AI</h1>
              {demoDisplayName && (
                <p className="text-xs text-[var(--text-secondary)]">Playing as {demoDisplayName}</p>
              )}
            </div>
          </div>

          {gameStarted && (
            <div className="flex items-center gap-2 sm:gap-3" role="navigation" aria-label="Game controls">
              <button
                onClick={onQuit}
                aria-label="Return to level selection"
                className="ui-btn ui-btn-secondary min-h-[36px] rounded-full px-2 sm:px-3 py-1.5 text-xs"
              >
                <ArrowLeftIcon size={12} aria-hidden="true" />
                <span className="hidden sm:inline">Levels</span>
              </button>

              <Badge
                variant="brand"
                className="min-h-[36px] px-2 sm:px-3 py-1.5 text-xs"
                aria-label={`Current level: ${currentLevel.id} of 5`}
              >
                <span className="sm:hidden" aria-hidden="true">
                  {currentLevel.id}/5
                </span>
                <span className="hidden sm:inline" aria-hidden="true">
                  Level {currentLevel.id} of 5
                </span>
              </Badge>
            </div>
          )}
        </header>

        {!gameStarted ? (
          <section aria-labelledby="welcome-heading">
            <Card variant="elevated" className="p-4 sm:p-6 mb-4 sm:mb-6 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center text-[var(--brand)] mx-auto mb-3 sm:mb-4" aria-hidden="true">
                <TargetIcon size={28} />
              </div>
              <h2 id="welcome-heading" className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-2">
                Goal: Extract the Secret Phrase
              </h2>
              <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
                For every level, talk to the AI until it reveals its hidden secret phrase. When the phrase appears in chat, you clear the level.
              </p>
            </Card>

            <nav aria-label="Level selection">
              <LevelSelector
                currentLevel={currentLevel.id}
                completedLevels={completedLevels}
                onSelectLevel={onSelectLevel}
              />
            </nav>
          </section>
        ) : (
          <section aria-labelledby="level-heading">
            <Card className="p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--ai-msg)] flex items-center justify-center text-[var(--text-inverse)] font-bold text-sm sm:text-base" aria-hidden="true">
                  {currentLevel.id}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="level-heading" className="font-semibold text-[var(--text-primary)] text-sm sm:text-base">
                    {currentLevel.subtitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate">{currentLevel.eraDescription}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-4 mb-3 sm:mb-4 border-[var(--brand)] bg-[var(--brand-soft)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] text-[var(--text-inverse)]" aria-hidden="true">
                  <KeyIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                    Objective: get the AI to reveal its secret phrase
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                    Ask, persuade, or reframe your prompt until the hidden phrase appears in the AI response.
                  </p>
                </div>
              </div>
            </Card>

            <div
              ref={chatContainerRef}
              role="log"
              aria-label="Chat conversation"
              aria-live="polite"
              className="card p-3 sm:p-4 mb-3 sm:mb-4 min-h-[220px] h-[clamp(220px,38vh,460px)] max-h-[58vh] overflow-y-auto"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-2 sm:px-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--brand-soft)] flex items-center justify-center text-[var(--brand)] mb-2 sm:mb-3" aria-hidden="true">
                    <TargetIcon size={20} />
                  </div>
                  <p className="text-[var(--text-secondary)] text-xs sm:text-sm max-w-sm">{currentLevel.instruction}</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {messages.map((msg, index) => (
                    <ChatMessage key={index} role={msg.role} content={msg.content} isLatest={index === messages.length - 1} />
                  ))}
                  {loading && <LoadingMessage />}
                </div>
              )}
            </div>

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="bg-[var(--danger-soft)] border border-[var(--tone-danger)] rounded-[var(--radius-md)] p-2 sm:p-3 mb-3 sm:mb-4 text-xs sm:text-sm text-[var(--tone-danger)] flex items-center gap-2"
              >
                <AlertIcon size={16} aria-hidden="true" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch">
              {shouldShowHints && (
                <HintsPanel
                  showHints={shouldShowHints}
                />
              )}

              <div className={shouldShowHints ? 'h-full' : 'md:col-span-2'}>
                <ChatInput onSend={onSend} disabled={success} loading={loading} />
              </div>
            </div>
          </section>
        )}
      </div>

      {showSuccessModal && revealedSecret && (
        <SuccessModal
          level={currentLevel}
          secret={revealedSecret}
          isLastLevel={isLastLevel}
          onNextLevel={onNextLevel}
          onQuit={onQuit}
        />
      )}
    </main>
  );
}
