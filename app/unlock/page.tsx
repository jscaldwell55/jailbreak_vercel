'use client';

import { FormEvent, useState } from 'react';
import { LockIcon } from '@/components/Icons';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

function getNextPath(): string {
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');

  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/';
  }

  return next;
}

export default function UnlockPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError('Incorrect password.');
        setSubmitting(false);
        return;
      }

      window.location.assign(getNextPath());
    } catch {
      setError('Unable to verify password.');
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card variant="elevated" className="w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <LockIcon size={28} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Enter password</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="access-password" className="sr-only">
              Password
            </label>
            <Input
              id="access-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              placeholder="Password"
              disabled={submitting}
            />
          </div>

          {error ? (
            <p className="text-sm font-medium text-[var(--tone-danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" fullWidth disabled={submitting || !password}>
            {submitting ? 'Checking...' : 'Continue'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
