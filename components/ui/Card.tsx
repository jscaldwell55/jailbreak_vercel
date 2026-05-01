import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type CardVariant = 'default' | 'elevated' | 'subtle';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'ui-card',
  elevated: 'ui-card-elevated',
  subtle: 'ui-card-subtle',
};

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', className, ...props },
  ref,
) {
  return <div ref={ref} className={cn(variantClasses[variant], className)} {...props} />;
});

export default Card;
