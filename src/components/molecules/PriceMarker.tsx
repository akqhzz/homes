'use client';
import type { MouseEvent } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/format';

interface PriceMarkerProps {
  price: number;
  isSelected?: boolean;
  isSaved?: boolean;
  isHovered?: boolean;
  isVisited?: boolean;
  onClick?: () => void;
}

export default function PriceMarker({ price, isSelected, isSaved, isHovered, isVisited, onClick }: PriceMarkerProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'type-micro inline-flex cursor-pointer items-center gap-1 rounded-full py-[0.3125rem] leading-none [font-size:0.6875rem] transition-colors duration-150 no-select',
        isSaved ? 'px-1.5' : 'px-2',
        isSelected
          ? 'bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] shadow-[0_3px_10px_rgba(0,0,0,0.22)]'
          : isHovered
          ? 'border border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
          : isSaved
          ? 'border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
          : isVisited
          ? 'border border-[var(--color-brand-200)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)] shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
          : 'border border-[var(--color-brand-600)] bg-[var(--color-marker-default-bg)] text-[var(--color-marker-default-text)] shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
      )}
    >
      {isSaved && (
        <Heart
          size={11}
          className="fill-[var(--color-accent)] text-[var(--color-accent)]"
          strokeWidth={2.2}
        />
      )}
      {formatPrice(price)}
    </button>
  );
}
