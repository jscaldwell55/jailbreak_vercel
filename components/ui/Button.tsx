import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] px-3 py-2 text-xs',
  md: 'min-h-[44px] px-4 py-2.5 text-sm',
  lg: 'min-h-[48px] px-5 py-3 text-sm',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'ui-btn-primary',
  secondary: 'ui-btn-secondary',
  ghost: 'ui-btn-ghost',
  danger: 'ui-btn-danger',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'ui-btn inline-flex items-center justify-center gap-2 font-semibold',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  );
});

export default Button;
