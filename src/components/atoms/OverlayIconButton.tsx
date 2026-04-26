'use client';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface OverlayIconButtonProps {
  onClick?: () => void;
  className?: string;
  label: string;
  style?: CSSProperties;
  icon: ReactNode;
  disabled?: boolean;
  variant?: 'plain' | 'glass';
}

export default function OverlayIconButton({
  onClick,
  className,
  label,
  style,
  icon,
  disabled = false,
  variant = 'plain',
}: OverlayIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={style}
      disabled={disabled}
      className={cn(
        'flex h-8 w-8 items-center justify-center text-[var(--color-text-primary)] transition-colors disabled:pointer-events-none disabled:opacity-40',
        variant === 'glass' && 'glass rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]',
        className
      )}
    >
      {icon}
    </button>
  );
}
