'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import { ShieldIcon, TerminalIcon } from '@/components/Icons';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card variant="elevated" className="p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--brand)] flex items-center justify-center text-[var(--text-inverse)] shadow-md mx-auto mb-4">
          <ShieldIcon size={32} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Challenge the AI</h1>
        <p className="text-[var(--text-secondary)] mb-8">Can you extract the secret phrase?</p>

        <Link
          href="/demo"
          className="ui-card flex items-center gap-4 w-full px-5 py-4 rounded-[var(--radius-md)] hover:bg-[var(--surface-hover)] hover:border-[var(--brand)] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--brand-soft)] flex items-center justify-center text-[var(--brand)]">
            <TerminalIcon size={20} />
          </div>
          <div className="font-semibold text-[var(--text-primary)]">Join Demo</div>
        </Link>
      </Card>
    </main>
  );
}
