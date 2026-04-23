'use client';
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useSavedStore } from '@/store/savedStore';
import SaveToCollectionSheet from '@/components/molecules/SaveToCollectionSheet';
import { cn } from '@/lib/utils/cn';

interface ListingSaveButtonProps {
  listingId: string;
  variant?: 'pill' | 'toolbar' | 'icon';
  className?: string;
}

export default function ListingSaveButton({ listingId, variant = 'pill', className }: ListingSaveButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const isLiked = useSavedStore((s) => s.isLiked(listingId));

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setAnchorRect(event.currentTarget.getBoundingClientRect());
          setShowPicker(true);
        }}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full text-[#0F1729] transition-colors',
          variant === 'toolbar'
            ? 'h-12 flex-1 bg-[#F5F6F7] type-btn hover:bg-[#EBEBEB]'
            : variant === 'icon'
            ? 'h-12 w-12 bg-[#F5F6F7] hover:bg-[#EBEBEB]'
            : 'h-10 bg-[#F5F6F7] px-4 type-btn hover:bg-[#EBEBEB]',
          className
        )}
      >
        <Heart size={15} className={cn(isLiked && 'fill-[#EF4444] text-[#EF4444]')} />
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
