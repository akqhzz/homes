'use client';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ActionRowProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'default' | 'danger';
  size?: 'sm' | 'md';
  selected?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

const ActionRow = forwardRef<HTMLButtonElement, ActionRowProps>(
  ({ tone = 'default', size = 'sm', selected = false, leading, trailing, className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex w-full items-center text-left font-medium transition-colors',
        size === 'sm' ? 'gap-2 rounded-xl px-3 py-2' : 'gap-3 rounded-2xl px-3 py-3',
        tone === 'danger'
          ? 'text-[var(--color-accent)] hover:bg-red-50'
          : selected
            ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]',
        className
      )}
      {...props}
    >
      {leading}
      {children}
      {trailing ?? (selected ? <Check size={14} className="ml-auto shrink-0" /> : null)}
    </button>
  )
);

ActionRow.displayName = 'ActionRow';
export default ActionRow;
