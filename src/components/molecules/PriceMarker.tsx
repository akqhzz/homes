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
  onClick?: () => void;
}

export default function PriceMarker({ price, isSelected, isSaved, isHovered, onClick }: PriceMarkerProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1 rounded-full py-[0.3125rem] text-[11px] font-semibold leading-none transition-all duration-150 no-select',
        isSaved ? 'px-1.5' : 'px-2',
        isSelected
          ? 'bg-[#0F1729] text-white shadow-[0_3px_10px_rgba(0,0,0,0.22)]'
          : isHovered
          ? 'bg-[#0F1729] text-white border border-[#0F1729] shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
          : isSaved
          ? 'bg-white text-[#0F1729] border border-[#E5E7EB] shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
          : 'border border-[var(--color-brand-500)] bg-[var(--color-marker-default-bg)] text-[var(--color-marker-default-text)] shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
      )}
    >
      {isSaved && (
        <Heart
          size={11}
          className={cn(isSelected ? 'fill-[#EF4444] text-[#EF4444]' : 'fill-[#EF4444] text-[#EF4444]')}
          strokeWidth={2.2}
        />
      )}
      {formatPrice(price)}
    </button>
  );
}
