import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'brand' | 'success' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: '',
  brand: 'ui-badge-brand',
  success: 'ui-badge-success',
  danger: 'ui-badge-danger',
};

export default function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return <span className={cn('ui-badge', variantClasses[variant], className)} {...props} />;
}
