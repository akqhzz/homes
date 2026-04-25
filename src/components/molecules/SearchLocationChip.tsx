'use client';
import { X } from 'lucide-react';
import { Location } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { getPrimaryLocationLabel } from '@/lib/utils/location-label';

interface SearchLocationChipProps {
  location: Location;
  onRemove: () => void;
  className?: string;
}

export default function SearchLocationChip({ location, onRemove, className }: SearchLocationChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-surface)] px-3 py-1 text-sm font-medium text-[var(--color-brand-text)] flex-shrink-0',
        className
      )}
    >
      {getPrimaryLocationLabel(location.name)}
      <button
        onClick={onRemove}
        className="text-[var(--color-brand-400)] hover:text-[var(--color-brand-700)] transition-colors -mr-0.5"
        aria-label="Remove"
      >
        <X size={13} />
      </button>
    </span>
  );
}
