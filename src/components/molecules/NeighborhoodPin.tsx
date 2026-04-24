'use client';
import Image from 'next/image';
import { Neighborhood } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

interface NeighborhoodPinProps {
  neighborhood: Neighborhood;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'default' | 'sm';
  showLabel?: boolean;
  variant?: 'default' | 'area-card' | 'cluster';
  count?: number;
}

export default function NeighborhoodPin({
  neighborhood,
  isSelected,
  onClick,
  size = 'default',
  showLabel = true,
  variant = 'default',
  count,
}: NeighborhoodPinProps) {
  if (variant === 'cluster') {
    return (
      <button
        onClick={onClick}
        className="flex h-11 min-w-11 items-center justify-center rounded-full border border-white/80 bg-[#0F1729]/88 px-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,41,0.28)] backdrop-blur"
      >
        {count}
      </button>
    );
  }

  if (variant === 'area-card') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'flex items-center gap-2 rounded-full border bg-white/94 p-1 pr-3 shadow-[0_10px_24px_rgba(15,23,41,0.14)] backdrop-blur transition-all duration-150 hover:scale-[1.02] active:scale-100',
          isSelected ? 'border-[#0F1729] ring-2 ring-[#0F1729]/10' : 'border-white/80'
        )}
      >
        <div className="h-9 w-9 overflow-hidden rounded-full">
          <Image
            src={neighborhood.thumbnail}
            alt={neighborhood.name}
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        </div>
        <span className="max-w-[108px] truncate text-[11px] font-semibold leading-none text-[#0F1729]">
          {neighborhood.name}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 no-select transition-all duration-150',
        'hover:scale-105 active:scale-100'
      )}
    >
      <div
        className={cn(
          'rounded-full overflow-hidden border-2 shadow-md transition-all duration-150',
          size === 'sm' ? 'w-10 h-10' : 'w-14 h-14',
          isSelected ? 'border-[#0F1729] scale-110' : 'border-white'
        )}
      >
        <Image
          src={neighborhood.thumbnail}
          alt={neighborhood.name}
          width={56}
          height={56}
          className="w-full h-full object-cover"
        />
      </div>
      {showLabel && (
        <span className={cn(
          'text-[#0F1729] bg-white/90 rounded-full shadow-sm whitespace-nowrap',
          size === 'sm' ? 'px-1.5 py-0.5 type-micro' : 'px-2 py-0.5 type-caption'
        )}>
          {neighborhood.name}
        </span>
      )}
    </button>
  );
}
