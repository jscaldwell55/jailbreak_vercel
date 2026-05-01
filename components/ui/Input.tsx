import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type InputSize = 'sm' | 'md';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  inputSize?: InputSize;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'text-xs min-h-[40px]',
  md: 'text-sm min-h-[44px]',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = 'md', className, ...props },
  ref,
) {
  return <input ref={ref} className={cn('ui-input', sizeClasses[inputSize], className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { inputSize = 'md', className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn('ui-textarea', sizeClasses[inputSize], className)} {...props} />;
});
