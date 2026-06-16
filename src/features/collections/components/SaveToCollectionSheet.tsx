'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Check, Plus } from 'lucide-react';
import { useSavedStore } from '@/store/savedStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import MobileDrawer from '@/components/ui/MobileDrawer';
import CreateInlineField from '@/components/ui/CreateInlineField';
import { cn } from '@/lib/utils/cn';

interface SaveToCollectionSheetProps {
  listingId: string;
  onClose: () => void;
  onSaved?: (collectionId: string, collectionName: string) => void;
  onRemoved?: (collectionId: string) => void;
  anchorRect?: DOMRect | null;
  placement?: 'above' | 'below';
  excludedCollectionIds?: string[];
}

const DESKTOP_DROPDOWN_MAX_HEIGHT = 360;
const DESKTOP_VIEWPORT_PADDING = 16;
const DESKTOP_ANCHOR_GAP = 10;

export default function SaveToCollectionSheet({
  listingId,
  onClose,
  onSaved,
  onRemoved,
  anchorRect,
  placement = 'below',
  excludedCollectionIds = [],
}: SaveToCollectionSheetProps) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const collections = useSavedStore((s) => s.collections);
  const addToCollection = useSavedStore((s) => s.addToCollection);
  const removeFromCollection = useSavedStore((s) => s.removeFromCollection);
  const createCollection = useSavedStore((s) => s.createCollection);
  const saveListing = useSavedStore((s) => s.saveListing);
  const unsaveListing = useSavedStore((s) => s.unsaveListing);
  const isLiked = useSavedStore((s) => s.isLiked(listingId));

  // A listing can live in many collections; each row is a checkbox that toggles
  // membership in that collection. The sheet stays open so users can pick several.
  const toggleCollection = (collectionId: string, collectionName: string, isMember: boolean) => {
    if (isMember) {
      removeFromCollection(collectionId, listingId);
      // Unchecking the last collection fully unsaves the listing.
      const stillInACollection = useSavedStore
        .getState()
        .collections.some((collection) => collection.listings.some((item) => item.listingId === listingId));
      if (!stillInACollection) unsaveListing(listingId);
      onRemoved?.(collectionId);
      return;
    }
    if (!isLiked) saveListing(listingId);
    addToCollection(collectionId, listingId);
    onSaved?.(collectionId, collectionName);
  };

  const createAndSave = () => {
    const name = newName.trim();
    if (!name) return;
    const collectionId = createCollection(name);
    if (!isLiked) saveListing(listingId);
    addToCollection(collectionId, listingId);
    onSaved?.(collectionId, name);
    setCreating(false);
    setNewName('');
  };

  const content = (
    <>
      <CreateInlineField
        open={creating}
        onOpenChange={setCreating}
        value={newName}
        onValueChange={setNewName}
        placeholder="New Collection..."
        collapsedLabel="New Collection"
        onSubmit={createAndSave}
        autoFocus
        submitLabel="Create"
        className="mb-4"
        collapsedClassName="mb-4 rounded-2xl font-medium"
      />

      <div className="flex flex-col gap-2.5">
        {collections.map((collection) => {
          const checked =
            !excludedCollectionIds.includes(collection.id) &&
            collection.listings.some((item) => item.listingId === listingId);
          const thumbnailListing = MOCK_LISTINGS.find((item) => item.id === collection.listings[0]?.listingId);
          return (
            <button
              key={collection.id}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => toggleCollection(collection.id, collection.name, checked)}
              className="flex min-h-[84px] w-full items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-[var(--color-text-primary)]">
                {thumbnailListing?.images[0] ? (
                  <Image src={thumbnailListing.images[0]} alt="" width={56} height={56} className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <Plus size={16} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="type-heading-sm block truncate text-[var(--color-text-primary)]">{collection.name}</span>
                <span className="block type-caption text-[var(--color-text-tertiary)]">
                  {checked ? 'Saved Here' : `${collection.listings.length} Listing${collection.listings.length === 1 ? '' : 's'}`}
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                  checked
                    ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-white'
                    : 'border-[var(--color-border-strong)] bg-white text-transparent'
                )}
              >
                <Check size={12} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
    </>
  );

  const viewportWidth = typeof window === 'undefined' ? 390 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 844 : window.innerHeight;
  const preferredLeft = anchorRect
    ? placement === 'above'
      ? anchorRect.left + anchorRect.width / 2 - 160
      : anchorRect.right - 320
    : viewportWidth / 2 - 160;
  const left = Math.min(Math.max(preferredLeft, 16), viewportWidth - 336);
  const preferredTop = anchorRect
    ? placement === 'above'
      ? anchorRect.top - DESKTOP_DROPDOWN_MAX_HEIGHT - DESKTOP_ANCHOR_GAP
      : anchorRect.bottom + DESKTOP_ANCHOR_GAP
    : 96;
  const top = Math.max(
    DESKTOP_VIEWPORT_PADDING,
    Math.min(preferredTop, viewportHeight - DESKTOP_DROPDOWN_MAX_HEIGHT - DESKTOP_VIEWPORT_PADDING)
  );
  const bottom = anchorRect && placement === 'above'
    ? Math.min(
      Math.max(viewportHeight - anchorRect.top + DESKTOP_ANCHOR_GAP, DESKTOP_VIEWPORT_PADDING),
      viewportHeight - DESKTOP_VIEWPORT_PADDING
    )
    : undefined;
  const maxHeight = anchorRect && placement === 'above'
    ? Math.min(DESKTOP_DROPDOWN_MAX_HEIGHT, Math.max(180, anchorRect.top - DESKTOP_ANCHOR_GAP - DESKTOP_VIEWPORT_PADDING))
    : DESKTOP_DROPDOWN_MAX_HEIGHT;
  const dropdownStyle = placement === 'above' && bottom !== undefined
    ? { left, bottom, maxHeight }
    : { left, top, maxHeight };

  const drawer = (
    <>
      {/* Stop clicks bubbling through the portal to a clickable card row behind it. */}
      <div className="lg:hidden" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
        <MobileDrawer
          title="Save To Collection"
          onClose={onClose}
          heightClassName="max-h-[84dvh]"
          contentClassName="px-4 pb-4"
          zIndex={90}
        >
          {content}
        </MobileDrawer>
      </div>
      <div className="hidden lg:block">
        <button
          type="button"
          aria-label="Close save to collection"
          className="fixed inset-0 z-[110] bg-transparent"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        />
        <div
          className="fixed z-[120] w-80 overflow-y-auto rounded-3xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,41,0.16)]"
          style={dropdownStyle}
          onMouseLeave={onClose}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          <p className="mb-3 type-heading text-[var(--color-text-primary)]">Save To Collection</p>
          {content}
        </div>
      </div>
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(
    drawer,
    document.body
  );
}
