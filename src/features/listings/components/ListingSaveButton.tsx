'use client';
import { useState } from 'react';
import { Heart } from 'lucide-react';
import Button from '@/components/ui/Button';
import SaveToCollectionSheet from '@/features/collections/components/SaveToCollectionSheet';
import { cn } from '@/lib/utils/cn';
import { useListingSave } from '@/features/listings/hooks/useListingSave';

interface ListingSaveButtonProps {
  listingId: string;
  variant?: 'pill' | 'toolbar' | 'icon';
  className?: string;
}

export default function ListingSaveButton({ listingId, variant = 'pill', className }: ListingSaveButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const { isSaved, unsave } = useListingSave(listingId);
  const isIconOnly = variant === 'icon';

  return (
    <>
      <Button
        variant="surface"
        size={variant === 'pill' ? 'md' : 'lg'}
        shape={isIconOnly ? 'circle' : 'pill'}
        aria-label={isIconOnly ? (isSaved ? 'Unsave listing' : 'Save listing') : undefined}
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
        className={cn(variant === 'toolbar' && 'flex-1', className)}
      >
        <Heart size={15} className={cn(isSaved && 'fill-[var(--color-accent)] text-[var(--color-accent)]')} />
        {!isIconOnly && 'Save'}
      </Button>
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
