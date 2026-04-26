'use client';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'type-btn inline-flex items-center justify-center rounded-full transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 no-select',
          {
            'bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)]': variant === 'primary',
            'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]': variant === 'secondary',
            'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]': variant === 'ghost',
            'bg-[var(--color-accent)] text-[var(--color-text-inverse)] hover:opacity-90': variant === 'danger',
          },
          {
            'px-3 h-8 gap-1.5': size === 'sm',
            'px-4 h-10 gap-2': size === 'md',
            'px-6 h-12 gap-2': size === 'lg',
          },
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
export default Button;
