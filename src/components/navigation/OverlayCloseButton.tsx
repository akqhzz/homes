'use client';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface OverlayCloseButtonProps {
  onClick?: () => void;
  className?: string;
  label?: string;
  style?: CSSProperties;
  variant?: 'plain' | 'overlay';
  fallbackHref?: string;
}

// Shared app close affordance. Routing fallback lives here, while the visual button remains in ui/Button.
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
    <Button
      onClick={handleClick}
      aria-label={label}
      style={style}
      variant={variant === 'overlay' ? 'overlay' : 'ghost'}
      shape="circle"
      size="sm"
      className={className}
    >
      <X size={14} />
    </Button>
  );
}
