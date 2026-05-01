'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AlertIcon } from '@/components/Icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the entire application.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging/monitoring
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card variant="elevated" className="p-6 text-center max-w-md mx-auto my-8">
          <div
            className="w-12 h-12 rounded-full bg-[var(--danger-soft)] flex items-center justify-center text-[var(--tone-danger)] mx-auto mb-4"
            aria-hidden="true"
          >
            <AlertIcon size={24} />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            An unexpected error occurred. Please try again.
          </p>
          <Button onClick={this.handleRetry} variant="primary">
            Try Again
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
