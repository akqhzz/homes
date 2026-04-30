'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StickyNote } from 'lucide-react';
import Button from '@/components/ui/Button';
import MobileDrawer from '@/components/ui/MobileDrawer';
import AnchoredPopover from '@/components/ui/AnchoredPopover';
import ButtonBadge from '@/components/ui/ButtonBadge';
import ControlPillButton from '@/components/ui/ControlPillButton';
import { useSavedStore } from '@/store/savedStore';
import { cn } from '@/lib/utils/cn';

interface ListingNoteButtonProps {
  listingId: string;
  variant: 'desktop' | 'mobile' | 'compact';
  className?: string;
}

export default function ListingNoteButton({ listingId, variant, className }: ListingNoteButtonProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const focusOnOpenRef = useRef(false);
  const collections = useSavedStore((state) => state.collections);
  const listingNotes = useSavedStore((state) => state.listingNotes);
  const setListingNote = useSavedStore((state) => state.setListingNote);

  const savedCollectionNote = useMemo(() => {
    for (const collection of collections) {
      const savedListing = collection.listings.find((item) => item.listingId === listingId && item.notes?.trim());
      if (savedListing?.notes) return savedListing.notes;
    }
    return '';
  }, [collections, listingId]);

  const note = listingNotes[listingId] ?? savedCollectionNote;
  const hasNote = note.trim().length > 0;
  const useDrawer = variant === 'mobile' || (variant === 'compact' && !isDesktop);

  useEffect(() => {
    if (variant !== 'compact') return;
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [variant]);

  useEffect(() => {
    if (!open || !focusOnOpenRef.current) return;
    const frame = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const openEditor = () => {
    if (open) {
      setOpen(false);
      return;
    }
    focusOnOpenRef.current = !hasNote;
    setDraft(note);
    setAnchorRect(buttonRef.current?.getBoundingClientRect() ?? null);
    setOpen(true);
  };

  const saveNote = () => {
    setListingNote(listingId, draft.trim());
    setOpen(false);
  };

  const content = (showTitle: boolean) => (
    <div className={cn('px-4 pb-4', showTitle ? 'pt-4' : 'pt-0')}>
      {showTitle && <p className="mb-3 type-heading-sm text-[var(--color-text-primary)]">Listing note</p>}
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="What do you want to remember?"
        className="min-h-32 w-full resize-none rounded-2xl border border-[var(--color-border)] bg-white p-3 type-body text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-text-primary)]"
      />
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button variant="surface" size="md" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button size="md" onClick={saveNote}>
          Save Note
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {variant === 'desktop' && hasNote ? (
        <ControlPillButton
          ref={buttonRef}
          active={hasNote}
          badge={hasNote ? 1 : null}
          aria-label={hasNote ? 'Edit listing note' : 'Add listing note'}
          onClick={(event) => {
            event.stopPropagation();
            openEditor();
          }}
          className={className}
        >
          <StickyNote size={16} className="text-[var(--color-text-primary)]" />
          Notes
        </ControlPillButton>
      ) : variant === 'desktop' ? (
        <Button
          ref={buttonRef}
          variant="surface"
          shape="pill"
          size="md"
          aria-label="Add listing note"
          onClick={(event) => {
            event.stopPropagation();
            openEditor();
          }}
          className={cn('type-label', className)}
        >
          <StickyNote size={15} />
          Notes
        </Button>
      ) : (
        <Button
          ref={buttonRef}
          variant="surface"
          shape="circle"
          size={variant === 'compact' ? 'sm' : 'control'}
          active={hasNote}
          aria-label={hasNote ? 'Edit listing note' : 'Add listing note'}
          onClick={(event) => {
            event.stopPropagation();
            openEditor();
          }}
          className={cn('relative', className)}
        >
          <StickyNote size={16} />
          {hasNote && <ButtonBadge className="-right-0.5 -top-0.5">1</ButtonBadge>}
        </Button>
      )}

      {useDrawer ? (
        open && (
          <MobileDrawer
            title="Listing note"
            onClose={() => setOpen(false)}
            heightClassName="h-auto max-h-[58dvh]"
            contentClassName="p-0"
            zIndex={90}
          >
            {content(false)}
          </MobileDrawer>
        )
      ) : (
        <AnchoredPopover
          open={open}
          anchorRect={anchorRect}
          onClose={() => setOpen(false)}
          className="fixed z-[90] w-[360px]"
          backdropClassName="z-[85]"
          align="right"
        >
          <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
            {content(true)}
          </div>
        </AnchoredPopover>
      )}
    </>
  );
}
