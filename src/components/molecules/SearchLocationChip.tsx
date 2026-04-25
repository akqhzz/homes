'use client';
import { X } from 'lucide-react';
import { Location } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { getPrimaryLocationLabel } from '@/lib/utils/location-label';

interface SearchLocationChipProps {
  location?: Location;
  label?: string;
  onRemove: () => void;
  className?: string;
}

// Shared removable chip used by search and filter summaries so chip language stays consistent.
export default function SearchLocationChip({ location, label, onRemove, className }: SearchLocationChipProps) {
  const chipLabel = label ?? (location ? getPrimaryLocationLabel(location.name) : '');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-surface)] px-3 py-1 text-sm font-medium text-[var(--color-brand-text)] flex-shrink-0',
        className
      )}
    >
      {chipLabel}
      <button
        onClick={onRemove}
        className="text-[var(--color-brand-text)] hover:text-[var(--color-brand-text)] transition-colors -mr-0.5"
        aria-label="Remove"
      >
        <X size={13} />
      </button>
    </span>
  );
}
