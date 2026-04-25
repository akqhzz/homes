'use client';
import type { MouseEvent } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/format';

interface PriceMarkerProps {
  price: number;
  isSelected?: boolean;
  isSaved?: boolean;
  onClick?: () => void;
}

export default function PriceMarker({ price, isSelected, isSaved, onClick }: PriceMarkerProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1 rounded-full py-2 text-xs font-semibold leading-none transition-all duration-150 no-select',
        isSaved ? 'px-2.5' : 'px-3',
        'hover:scale-105 active:scale-100',
        isSelected
          ? 'bg-[#0F1729] text-white scale-110 shadow-[0_3px_10px_rgba(0,0,0,0.22)]'
          : isSaved
          ? 'bg-white text-[#0F1729] border border-[#E5E7EB] shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
          : 'bg-white text-[#0F1729] border border-[#E5E7EB] shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
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
