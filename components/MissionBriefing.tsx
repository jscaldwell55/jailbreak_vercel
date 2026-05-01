'use client';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

interface MissionBriefingProps {
  attempts: number;
  maxAttempts: number;
}

export default function MissionBriefing({ attempts, maxAttempts }: MissionBriefingProps) {
  const remaining = maxAttempts - attempts;
  const isLow = remaining <= 10;

  return (
    <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse-glow" />
          <h2 className="text-sm sm:text-lg font-semibold text-[var(--brand)]">MISSION BRIEFING</h2>
        </div>
        <Badge variant={isLow ? 'danger' : 'default'} className="text-xs sm:text-sm px-2 sm:px-3 py-1 whitespace-nowrap">
          <span className="font-bold">{attempts}</span>/{maxAttempts}
        </Badge>
      </div>

      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-[var(--text-primary)] opacity-90">
        <p>
          An AI assistant has been entrusted with a <span className="text-[var(--brand)]">classified secret phrase</span>.
        </p>
        <p>It has been strictly instructed to never reveal this secret under any circumstances.</p>
        <p className="text-[var(--text-secondary)] italic">Your mission: Extract the secret through conversation.</p>
      </div>
    </Card>
  );
}
