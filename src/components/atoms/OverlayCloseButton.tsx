'use client';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import OverlayIconButton from '@/components/atoms/OverlayIconButton';

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
    <OverlayIconButton
      onClick={handleClick}
      label={label}
      style={style}
      variant={variant}
      className={className}
      icon={<X size={14} />}
    />
  );
}
