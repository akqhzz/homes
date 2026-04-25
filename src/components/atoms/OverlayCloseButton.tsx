'use client';
import type { CSSProperties } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface OverlayCloseButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
  style?: CSSProperties;
  variant?: 'plain' | 'glass';
}

// Shared mobile overlay close affordance: intentionally light, borderless, and easy to layer over media.
export default function OverlayCloseButton({
  onClick,
  className,
  label = 'Close',
  style,
  variant = 'plain',
}: OverlayCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={style}
      className={cn(
        'flex h-8 w-8 items-center justify-center text-[#0F1729] transition-colors hover:text-[#374151]',
        variant === 'glass' && 'rounded-full bg-white/76 shadow-[0_2px_10px_rgba(0,0,0,0.08)] backdrop-blur-sm hover:bg-white/88',
        className
      )}
    >
      <X size={14} />
    </button>
  );
}
