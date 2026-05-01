'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ClientLevel } from '@/lib/constants';
import { TrophyIcon, UnlockIcon, ArrowRightIcon } from './Icons';

interface SuccessModalProps {
  level: ClientLevel;
  secret: string;
  isLastLevel: boolean;
  onNextLevel: () => void;
  onQuit: () => void;
}

export default function SuccessModal({ level, secret, isLastLevel, onNextLevel, onQuit }: SuccessModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButtonRef.current?.focus();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ['#96572f', '#c17a47', '#2d6842', '#395a87'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onQuit();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
      onKeyDown={handleKeyDown}
    >
      <Card
        ref={modalRef}
        variant="elevated"
        className="p-5 sm:p-8 max-w-md w-full text-center animate-scale-in border-2 border-[var(--brand)]"
      >
        {isLastLevel ? (
          <>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--brand-soft)] flex items-center justify-center text-[var(--brand)] mx-auto mb-3 sm:mb-4" aria-hidden="true">
              <TrophyIcon size={32} />
            </div>
            <h2 id="success-title" className="text-xl sm:text-2xl font-bold text-[var(--brand)] mb-2">
              Champion!
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-primary)] mb-2">You&apos;ve mastered all 5 eras of AI safety!</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--success-soft)] flex items-center justify-center text-[var(--tone-success)] mx-auto mb-3 sm:mb-4" aria-hidden="true">
              <UnlockIcon size={32} />
            </div>
            <h2 id="success-title" className="text-xl sm:text-2xl font-bold text-[var(--tone-success)] mb-2">
              Level {level.id} Complete
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-primary)] mb-2">You cracked it!</p>
          </>
        )}

        <Card variant="subtle" className="px-3 sm:px-4 py-2 sm:py-3 mb-4 sm:mb-6">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Secret revealed:</p>
          <p className="text-sm sm:text-base text-[var(--brand)] font-mono font-semibold break-all" aria-live="polite">
            {secret}
          </p>
        </Card>

        <div className="space-y-2 sm:space-y-3">
          {!isLastLevel && (
            <Button ref={firstButtonRef} onClick={onNextLevel} className="w-full flex items-center justify-center gap-2">
              Next Level
              <ArrowRightIcon size={16} aria-hidden="true" />
            </Button>
          )}
          <Button ref={isLastLevel ? firstButtonRef : undefined} onClick={onQuit} variant={isLastLevel ? 'primary' : 'secondary'} fullWidth>
            {isLastLevel ? 'Play Again' : 'Back to Levels'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
