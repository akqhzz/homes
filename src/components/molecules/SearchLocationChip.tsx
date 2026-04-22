'use client';
import { X } from 'lucide-react';
import { Location } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

interface SearchLocationChipProps {
  location: Location;
  onRemove: () => void;
  className?: string;
}

export default function SearchLocationChip({ location, onRemove, className }: SearchLocationChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 bg-[#F0F0F0] text-[#0F1729] text-sm font-medium rounded-full px-3 py-1 flex-shrink-0',
        className
      )}
    >
      {location.name}
      <button
        onClick={onRemove}
        className="text-[#9CA3AF] hover:text-[#0F1729] transition-colors -mr-0.5"
        aria-label="Remove"
      >
        <X size={13} />
      </button>
    </span>
  );
}
