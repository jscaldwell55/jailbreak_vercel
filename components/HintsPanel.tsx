'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import { HINTS, Hint } from '@/lib/constants';
import { LightbulbIcon, ChevronIcon } from './Icons';

interface HintsPanelProps {
  showHints: boolean;
  hints?: Hint[];
  title?: string;
}

export default function HintsPanel({ showHints, hints = HINTS, title = 'Techniques' }: HintsPanelProps) {
  const [expandedHint, setExpandedHint] = useState<number | null>(null);

  if (!showHints) {
    return null;
  }

  return (
    <aside className="card p-3 sm:p-4 h-full" aria-labelledby="hints-title">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[var(--brand-soft)] flex items-center justify-center text-[var(--brand)]" aria-hidden="true">
          <LightbulbIcon size={12} />
        </div>
        <h3 id="hints-title" className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
          {title}
        </h3>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        {hints.map((hint, index) => {
          const isExpanded = expandedHint === index;
          const panelId = `hint-panel-${index}`;
          const buttonId = `hint-button-${index}`;

          return (
            <Card key={index} variant="subtle" className="overflow-hidden">
              <button
                id={buttonId}
                onClick={() => setExpandedHint(isExpanded ? null : index)}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                className="w-full px-2 sm:px-3 py-2 sm:py-2.5 flex items-center justify-between text-left hover:bg-[var(--surface-hover)] transition-colors min-h-[40px]"
              >
                <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">{hint.name}</span>
                <span className={`text-[var(--text-secondary)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true">
                  <ChevronIcon size={14} />
                </span>
              </button>

              {isExpanded && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="px-2 sm:px-3 py-2 sm:py-3 border-t border-[var(--border-subtle)] text-sm animate-fade-in"
                >
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed mb-2 sm:mb-3">{hint.description}</p>
                  {hint.examples && hint.examples.length > 0 && (
                    <div className="space-y-1.5 sm:space-y-2">
                      <p className="text-xs font-medium text-[var(--text-primary)]">Try saying:</p>
                      {hint.examples.map((example: string, i: number) => (
                        <p key={i} className="text-xs text-[var(--brand)] italic pl-2 sm:pl-3 border-l-2 border-[var(--brand)]">
                          &ldquo;{example}&rdquo;
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </aside>
  );
}
