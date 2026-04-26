'use client';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface ControlPillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  badge?: ReactNode;
}

export default function ControlPillButton({
  active = false,
  badge,
  className,
  children,
  ...props
}: ControlPillButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'relative flex h-11 items-center gap-2 rounded-full bg-white px-4 type-btn text-[var(--color-text-primary)] shadow-[var(--shadow-control)] transition-colors hover:bg-[var(--color-surface)] no-select',
        active && 'border border-[var(--color-text-primary)] shadow-[inset_0_0_0_1px_var(--color-text-primary)]',
        className
      )}
      {...props}
    >
      {children}
      {badge && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--color-text-primary)] px-1 type-nano leading-none text-[var(--color-text-inverse)]">
          {badge}
        </span>
      )}
    </button>
  );
}
