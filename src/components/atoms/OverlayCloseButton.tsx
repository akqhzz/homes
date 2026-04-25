'use client';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface OverlayCloseButtonProps {
  onClick?: () => void;
  className?: string;
  label?: string;
  style?: CSSProperties;
  variant?: 'plain' | 'glass';
  fallbackHref?: string;
}

// Shared mobile overlay close affordance: intentionally light, borderless, and easy to layer over media.
export default function OverlayCloseButton({
  onClick,
  className,
  label = 'Close',
  style,
  variant = 'plain',
  fallbackHref = '/',
}: OverlayCloseButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (typeof window !== 'undefined' && window.history.length <= 1) {
      router.push(fallbackHref);
      return;
    }
    router.back();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      style={style}
      className={cn(
        'flex h-8 w-8 items-center justify-center text-[#0F1729] transition-colors',
        variant === 'glass' && 'rounded-full bg-white/40 text-[#0F1729]/70 backdrop-blur hover:bg-white/70 hover:text-[#0F1729]',
        className
      )}
    >
      <X size={14} />
    </button>
  );
}
