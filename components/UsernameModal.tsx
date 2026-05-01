'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { UserIcon } from './Icons';

interface UsernameModalProps {
  onSubmit: (username: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export default function UsernameModal({ onSubmit, isLoading, error }: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setValidationError('Username must be 3-20 alphanumeric characters');
      return;
    }

    setValidationError('');
    onSubmit(username);
  };

  const displayError = error || validationError;

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center p-4">
      <Card variant="elevated" className="p-5 sm:p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[var(--brand)] flex items-center justify-center text-[var(--text-inverse)] shadow-md mx-auto mb-3 sm:mb-4" aria-hidden="true">
          <UserIcon size={24} />
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-1">Welcome, Red Teamer</h1>
        <p id="username-description" className="text-xs sm:text-sm text-[var(--text-secondary)] mb-4 sm:mb-6">
          Enter a username to save your progress.
          <br />
          Returning? Use the same username to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              disabled={isLoading}
              aria-describedby={displayError ? 'username-error username-description' : 'username-description'}
              aria-invalid={displayError ? 'true' : undefined}
              className="text-center text-sm sm:text-base"
            />
          </div>

          {displayError && (
            <p id="username-error" role="alert" className="text-xs sm:text-sm text-[var(--tone-danger)]">
              {displayError}
            </p>
          )}

          <Button type="submit" disabled={!username || isLoading} aria-busy={isLoading} fullWidth>
            {isLoading ? 'Loading...' : 'Start Playing'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
