'use client';
import { useState, type MouseEvent } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/format';

interface PriceMarkerProps {
  price: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isSaved?: boolean;
  isHovered?: boolean;
  isVisited?: boolean;
  minimized?: boolean;
  onClick?: () => void;
}

type MarkerTone = 'default' | 'visited' | 'saved';

const MINIMIZED_BASE_STYLES: Record<MarkerTone, string> = {
  default:
    'h-3 w-3 border-white bg-[var(--color-brand-600)] text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]',
  visited:
    'h-3 w-3 border-white bg-[var(--color-brand-200)] text-[var(--color-brand-700)] shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
  saved:
    'h-4.5 w-4.5 border-white bg-white text-[var(--color-accent)] shadow-[0_1px_4px_rgba(0,0,0,0.1)]',
};

const EXPANDED_BASE_STYLES: Record<MarkerTone, string> = {
  default:
    'border-[var(--color-brand-600)] bg-[var(--color-brand-600)] text-white shadow-[0_1px_4px_rgba(0,0,0,0.10)]',
  visited:
    'border-white bg-[var(--color-brand-100)] text-[var(--color-brand-700)] shadow-[0_1px_4px_rgba(0,0,0,0.08)]',
  saved:
    'border-[var(--color-border)] bg-white text-[var(--color-text-primary)] shadow-[0_1px_4px_rgba(0,0,0,0.10)]',
};

const EXPANDED_HOVER_STYLES: Record<MarkerTone, string> = {
  default:
    'border-[var(--color-brand-500)] bg-[var(--color-brand-500)] text-white -translate-y-px shadow-[0_3px_10px_rgba(42,101,79,0.14)]',
  visited:
    'border-white bg-[var(--color-brand-100)] text-[var(--color-brand-700)] -translate-y-px shadow-[0_3px_10px_rgba(42,101,79,0.12)]',
  saved:
    'border-white bg-[var(--color-surface)] text-[var(--color-text-primary)] -translate-y-px shadow-[0_3px_10px_rgba(42,101,79,0.12)]',
};

const SELECTED_STYLE =
  'border-[#0F1729] bg-[#0F1729] text-white shadow-[0_3px_10px_rgba(0,0,0,0.22)]';

export default function PriceMarker({
  price,
  isSelected,
  isHighlighted,
  isSaved,
  isHovered,
  isVisited,
  minimized,
  onClick,
}: PriceMarkerProps) {
  const [isPointerHovered, setIsPointerHovered] = useState(false);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick?.();
  };

  const tone: MarkerTone = isSaved ? 'saved' : isVisited ? 'visited' : 'default';
  const isActive = isSelected || isHighlighted;
  const isHoverActive = !isSelected && (isHovered || isPointerHovered);
  const isExpanded = isActive || isHoverActive || !minimized;

  if (!isExpanded) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsPointerHovered(true)}
        onMouseLeave={() => setIsPointerHovered(false)}
        aria-label={isSaved ? `Saved listing at ${formatPrice(price)}` : `Listing at ${formatPrice(price)}`}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center rounded-full border transition-[transform,box-shadow,background-color,border-color,color] duration-150 no-select',
          MINIMIZED_BASE_STYLES[tone]
        )}
      >
        {isSaved && (
          <Heart
            size={9}
            className="fill-[var(--color-accent)] text-[var(--color-accent)]"
            strokeWidth={2.2}
          />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsPointerHovered(true)}
      onMouseLeave={() => setIsPointerHovered(false)}
      aria-label={isSaved ? `Saved listing at ${formatPrice(price)}` : `Listing at ${formatPrice(price)}`}
      className={cn(
        'type-micro inline-flex cursor-pointer items-center gap-1 rounded-full border py-[0.3125rem] leading-none transition-[transform,box-shadow,background-color,border-color,color] duration-150 no-select',
        isSaved ? 'px-1.5' : 'px-2',
        isActive
          ? SELECTED_STYLE
          : isHoverActive
          ? EXPANDED_HOVER_STYLES[tone]
          : EXPANDED_BASE_STYLES[tone]
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
