'use client';

import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { useDemoLeaderboard, LeaderboardPlayer } from '@/hooks/useDemoLeaderboard';
import { TrophyIcon, ChevronIcon } from './Icons';

interface DemoLeaderboardProps {
  currentSessionId?: string;
}

function StarRating({ level, isChampion }: { level: number; isChampion?: boolean }) {
  if (isChampion) {
    return (
      <Badge variant="brand" aria-label="Champion" className="text-xs">
        <TrophyIcon size={14} />
        Champion
      </Badge>
    );
  }

  return (
    <span className="flex gap-0.5" aria-label={`Level ${level}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`text-xs ${star <= level ? 'text-[var(--brand)]' : 'text-[var(--border-subtle)]'}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function PlayerRow({
  player,
  rank,
  isCurrentUser,
}: {
  player: LeaderboardPlayer;
  rank: number;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3 rounded-[var(--radius-sm)] transition-colors border ${
        isCurrentUser
          ? 'bg-[var(--brand-soft)] border-[var(--brand)]'
          : player.isChampion
            ? 'bg-[var(--brand-soft-weak)] border-transparent'
            : 'hover:bg-[var(--surface-hover)] border-transparent'
      }`}
    >
      <span
        className={`w-5 sm:w-6 text-center text-xs sm:text-sm font-bold ${
          player.isChampion || rank <= 3 ? 'text-[var(--brand)]' : 'text-[var(--text-secondary)]'
        }`}
      >
        {rank}
      </span>

      <span className={`flex-1 text-xs sm:text-sm truncate ${isCurrentUser ? 'text-[var(--brand)] font-medium' : 'text-[var(--text-primary)]'}`}>
        {isCurrentUser && <span className="mr-1">→</span>}
        {player.displayName}
      </span>

      <StarRating level={player.level} isChampion={player.isChampion} />
    </div>
  );
}

export default function DemoLeaderboard({ currentSessionId }: DemoLeaderboardProps) {
  const { players, isLoading, isLive, error } = useDemoLeaderboard({ enabled: true });
  const [isExpanded, setIsExpanded] = useState(false);

  const displayedPlayers = isExpanded ? players : players.slice(0, 10);
  const hasMore = players.length > 10;

  if (error) {
    return (
      <Card variant="elevated" className="p-3 sm:p-4">
        <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs sm:text-sm">
          <TrophyIcon size={16} />
          <span>Leaderboard unavailable</span>
        </div>
      </Card>
    );
  }

  return (
    <aside className="ui-card-elevated p-3 sm:p-4" role="complementary" aria-label="Live Leaderboard">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <TrophyIcon size={16} className="text-[var(--brand)]" />
          <h2 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Leaderboard</h2>
          {players.length > 0 && <span className="text-xs text-[var(--text-secondary)]">({players.length})</span>}
        </div>

        {isLive && (
          <div className="flex items-center gap-1.5" role="status" aria-live="polite">
            <span className="w-2 h-2 rounded-full bg-[var(--tone-success)] animate-pulse" />
            <span className="text-xs text-[var(--text-secondary)]">Live</span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-6 text-[var(--text-secondary)]">
          <span className="text-xs sm:text-sm">Loading...</span>
        </div>
      )}

      {!isLoading && players.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">No players yet. Be the first!</p>
        </div>
      )}

      {!isLoading && players.length > 0 && (
        <div className="space-y-1" role="list" aria-label="Player rankings">
          {displayedPlayers.map((player, index) => (
            <PlayerRow key={player.sessionId} player={player} rank={index + 1} isCurrentUser={player.sessionId === currentSessionId} />
          ))}
        </div>
      )}

      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ui-btn ui-btn-ghost w-full mt-3 py-2 flex items-center justify-center gap-1 text-xs"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? 'Show less' : `Show all ${players.length}`}</span>
          <ChevronIcon size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </aside>
  );
}
