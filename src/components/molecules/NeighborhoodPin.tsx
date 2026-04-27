'use client';
import type { MouseEvent } from 'react';
import Image from 'next/image';
import { Neighborhood } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import MapClusterMarker from '@/components/molecules/MapClusterMarker';

interface NeighborhoodPinProps {
  neighborhood: Neighborhood;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'default' | 'sm';
  showLabel?: boolean;
  variant?: 'default' | 'cluster';
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
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick?.();
  };

  if (variant === 'cluster') {
    return (
      <MapClusterMarker
        count={count ?? 0}
        onClick={handleClick}
        aria-label={`Expand ${count ?? 0} areas`}
      />
    );
  }

  return (
    <button
      onClick={handleClick}
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
          'type-micro whitespace-nowrap rounded-full bg-white/90 text-[var(--color-text-primary)] shadow-sm',
          size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-0.5'
        )}>
          {neighborhood.name}
        </span>
      )}
    </button>
  );
}
