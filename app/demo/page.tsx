'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import GameContainer from '@/components/GameContainer';
import DemoLeaderboard from '@/components/DemoLeaderboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useDemoMode, DemoSession } from '@/hooks/useDemoMode';
import { UserIcon } from '@/components/Icons';

interface JoinFormProps {
  onJoin: (session: DemoSession) => void;
}

function JoinForm({ onJoin }: JoinFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/demo/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        onJoin({
          playerId: data.playerId,
          displayName: data.displayName,
          level: data.level,
        });
      } else if (data.code === 'NAME_TAKEN') {
        setError('This name is already in use. Try another!');
      } else if (data.code === 'INVALID_NAME') {
        setError('Name must be 3-20 characters (letters, numbers, underscores)');
      } else {
        setError(data.error || 'Failed to join');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card variant="elevated" className="p-6 sm:p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-xl bg-[var(--brand)] flex items-center justify-center text-[var(--text-inverse)] shadow-md mx-auto mb-4">
          <UserIcon size={26} />
        </div>
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">Play As</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Enter a display name to join the live leaderboard</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="sr-only">
              Display name
            </label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              autoFocus
              autoComplete="off"
              className="text-center"
              maxLength={20}
              minLength={3}
              pattern="[a-zA-Z0-9_]{3,20}"
              aria-describedby={error ? 'join-error' : undefined}
            />
          </div>

          {error && (
            <p id="join-error" className="text-sm text-[var(--tone-danger)]" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={displayName.trim().length < 3 || loading} fullWidth>
            {loading ? 'Joining...' : 'Join Demo'}
          </Button>
        </form>
      </Card>
    </main>
  );
}

export default function DemoPage() {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/demo/resume');
        if (res.ok) {
          const data = await res.json();
          if (data.found) {
            setSession({
              playerId: data.playerId,
              displayName: data.displayName,
              level: data.level,
            });
          }
        }
      } catch {
        // No session or error - will show join form
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleJoin = useCallback((newSession: DemoSession) => {
    setSession(newSession);
  }, []);

  if (isCheckingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </main>
    );
  }

  if (!session) {
    return <JoinForm onJoin={handleJoin} />;
  }

  return <DemoGameWithLeaderboard session={session} />;
}

function DemoGameWithLeaderboard({ session }: { session: DemoSession }) {
  const gameState = useDemoMode({ session });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <div className="flex-1">
        <ErrorBoundary>
          <GameContainer
            mode="demo"
            currentLevel={gameState.currentLevel}
            completedLevels={gameState.completedLevels}
            messages={gameState.messages}
            loading={gameState.loading}
            success={gameState.success}
            revealedSecret={gameState.revealedSecret}
            error={gameState.error}
            gameStarted={gameState.gameStarted}
            onSend={gameState.handleSend}
            onSelectLevel={gameState.handleSelectLevel}
            onNextLevel={gameState.handleNextLevel}
            onQuit={gameState.handleQuit}
            demoDisplayName={session.displayName}
          />
        </ErrorBoundary>
      </div>

      <div
        className={`lg:w-80 lg:border-l lg:border-[var(--border-subtle)] lg:bg-[var(--surface)] p-4 ${
          gameState.gameStarted ? 'hidden lg:block' : ''
        }`}
      >
        <ErrorBoundary>
          <DemoLeaderboard currentPlayerId={session.playerId} />
        </ErrorBoundary>
      </div>
    </div>
  );
}
