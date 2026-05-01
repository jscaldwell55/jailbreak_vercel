'use client';

import Card from '@/components/ui/Card';
import { LEVELS, ClientLevel } from '@/lib/constants';
import { CheckIcon, LockIcon } from './Icons';

interface LevelSelectorProps {
  currentLevel: number;
  completedLevels: number[];
  onSelectLevel: (level: ClientLevel) => void;
  levels?: ClientLevel[];
  title?: string;
  description?: string;
}

export default function LevelSelector({
  currentLevel,
  completedLevels,
  onSelectLevel,
  levels = LEVELS,
  title = 'The Evolution of AI Safety',
  description,
}: LevelSelectorProps) {
  return (
    <Card variant="elevated" className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <div className="w-2 h-2 rounded-full bg-[var(--brand)]" aria-hidden="true" />
        <h2 id="level-list-title" className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
          {title}
        </h2>
      </div>
      {description && <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-4 sm:mb-6">{description}</p>}

      <div className="space-y-2 sm:space-y-3" role="list" aria-labelledby="level-list-title">
        {levels.map((level, index) => {
          const isCompleted = completedLevels.includes(level.id);
          const isCurrent = currentLevel === level.id;
          const isLocked = level.id > 1 && !completedLevels.includes(level.id - 1) && !isCurrent;
          const isLast = index === levels.length - 1;
          const statusLabel = isCompleted ? 'Completed' : isLocked ? 'Locked' : isCurrent ? 'Current level' : 'Available';

          return (
            <div key={level.id} className="flex gap-2 sm:gap-4" role="listitem">
              <div className="flex flex-col items-center" aria-hidden="true">
                <button
                  onClick={() => !isLocked && onSelectLevel(level)}
                  disabled={isLocked}
                  tabIndex={-1}
                  aria-hidden="true"
                  className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm
                    transition-all duration-200 min-h-[32px] sm:min-h-[40px]
                    ${isCompleted
                      ? 'bg-[var(--tone-success)] text-[var(--text-inverse)] shadow-md'
                      : isCurrent
                        ? 'bg-[var(--brand)] text-[var(--text-inverse)] shadow-md ring-2 sm:ring-4 ring-[var(--brand-soft)]'
                        : isLocked
                          ? 'bg-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed'
                          : 'bg-[var(--surface)] border-2 border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--brand)] hover:text-[var(--brand)]'
                    }
                  `}
                >
                  {isCompleted ? <CheckIcon size={16} /> : isLocked ? <LockIcon size={14} /> : level.id}
                </button>
                {!isLast && (
                  <div
                    className={`w-0.5 h-6 sm:h-8 mt-1.5 sm:mt-2 ${
                      isCompleted ? 'bg-[var(--tone-success)]' : 'bg-[var(--border-subtle)]'
                    }`}
                  />
                )}
              </div>

              <button
                onClick={() => !isLocked && onSelectLevel(level)}
                disabled={isLocked}
                aria-label={`Level ${level.id}: ${level.subtitle}. ${statusLabel}`}
                aria-current={isCurrent ? 'true' : undefined}
                className={`
                  flex-1 text-left p-3 sm:p-4 rounded-[var(--radius-md)] transition-all duration-200 min-h-[44px]
                  ${isCurrent
                    ? 'bg-[var(--brand-soft)] border border-[var(--brand)]'
                    : isCompleted
                      ? 'bg-[var(--success-soft)] border border-transparent hover:border-[var(--tone-success)]'
                      : isLocked
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border-subtle)]'
                  }
                `}
              >
                <span
                  className={`font-semibold text-sm sm:text-base ${
                    isCurrent
                      ? 'text-[var(--brand)]'
                      : isCompleted
                        ? 'text-[var(--tone-success)]'
                        : 'text-[var(--text-primary)]'
                  }`}
                >
                  {level.subtitle}
                </span>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">{level.eraDescription}</p>
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
