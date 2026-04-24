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
        'relative flex h-11 items-center gap-2 rounded-full bg-white px-4 type-btn text-[#0F1729] shadow-[var(--shadow-control)] transition-colors hover:bg-[#F5F6F7] no-select',
        active && 'shadow-[inset_0_0_0_1.5px_#374151,0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]',
        className
      )}
      {...props}
    >
      {children}
      {badge && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#374151] px-1 type-nano leading-none text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
