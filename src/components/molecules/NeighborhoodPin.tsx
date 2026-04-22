'use client';
import { Neighborhood } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

interface NeighborhoodPinProps {
  neighborhood: Neighborhood;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'default' | 'sm';
}

export default function NeighborhoodPin({ neighborhood, isSelected, onClick, size = 'default' }: NeighborhoodPinProps) {
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
        <img
          src={neighborhood.thumbnail}
          alt={neighborhood.name}
          className="w-full h-full object-cover"
        />
      </div>
      <span className={cn(
        'font-medium text-[#0F1729] bg-white/90 rounded-full shadow-sm whitespace-nowrap',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      )}>
        {neighborhood.name}
      </span>
    </button>
  );
}
