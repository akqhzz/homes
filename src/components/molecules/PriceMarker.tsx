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
        'inline-flex cursor-pointer items-center gap-1 px-2 py-1 rounded-full type-fine transition-all duration-150 no-select',
        'hover:scale-105 active:scale-100',
        isSelected
          ? 'bg-[#0F1729] text-white scale-110 shadow-[0_2px_8px_rgba(0,0,0,0.20)]'
          : isSaved
          ? 'bg-white text-[#0F1729] border border-[#E5E7EB] shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
          : 'bg-white text-[#0F1729] border border-[#E5E7EB] shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
      )}
    >
      {isSaved && !isSelected && <Heart size={10} className="fill-[#EC4899] text-[#EC4899]" strokeWidth={2.2} />}
      {formatPrice(price)}
    </button>
  );
}
