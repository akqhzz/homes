'use client';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/format';

interface PriceMarkerProps {
  price: number;
  isSelected?: boolean;
  isSaved?: boolean;
  onClick?: () => void;
}

export default function PriceMarker({ price, isSelected, isSaved, onClick }: PriceMarkerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 no-select',
        'hover:scale-105 active:scale-100',
        isSelected
          ? 'bg-[#0F1729] text-white scale-110 shadow-[0_2px_8px_rgba(0,0,0,0.20)]'
          : isSaved
          ? 'bg-[#EF4444] text-white shadow-[0_1px_4px_rgba(0,0,0,0.14)]'
          : 'bg-white text-[#0F1729] border border-[#E5E7EB] shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
      )}
    >
      {isSaved && !isSelected && <span className="text-[9px] leading-none">♥</span>}
      {formatPrice(price)}
    </button>
  );
}
