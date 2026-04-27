'use client';
import { useState } from 'react';
import { Heart } from 'lucide-react';
import SaveToCollectionSheet from '@/components/molecules/SaveToCollectionSheet';
import { cn } from '@/lib/utils/cn';
import { useListingSave } from '@/hooks/useListingSave';

interface ListingSaveButtonProps {
  listingId: string;
  variant?: 'pill' | 'toolbar' | 'icon';
  className?: string;
}

export default function ListingSaveButton({ listingId, variant = 'pill', className }: ListingSaveButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const { isSaved, unsave } = useListingSave(listingId);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (isSaved) {
            unsave();
            setShowPicker(false);
            return;
          }
          setAnchorRect(event.currentTarget.getBoundingClientRect());
          setShowPicker(true);
        }}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full text-[var(--color-text-primary)] transition-colors',
          variant === 'toolbar'
            ? 'h-12 flex-1 bg-[var(--color-surface)] type-btn hover:bg-[var(--color-surface-hover)]'
            : variant === 'icon'
            ? 'h-12 w-12 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
            : 'h-10 bg-[var(--color-surface)] px-4 type-btn hover:bg-[var(--color-surface-hover)]',
          className
        )}
      >
        <Heart size={15} className={cn(isSaved && 'fill-[var(--color-accent)] text-[var(--color-accent)]')} />
        {variant !== 'icon' && 'Save'}
      </button>
      {showPicker && (
        <SaveToCollectionSheet
          listingId={listingId}
          anchorRect={anchorRect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
