'use client';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface MapListingPinProps {
  className?: string;
  size?: number;
  dotSize?: number;
}

// Shared listing map marker for mobile saved/cards previews and interactive mini-maps.
export default function MapListingPin({ className, size = 22, dotSize = 6 }: MapListingPinProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('relative inline-flex items-start justify-center', className)}
      style={{ width: size, height: size }}
    >
      <MapPin size={size} strokeWidth={2.15} className="fill-[#0F1729] text-[#0F1729]" />
      <span
        className="absolute rounded-full bg-white"
        style={{
          width: dotSize,
          height: dotSize,
          top: Math.round(size * 0.31),
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
    </span>
  );
}
