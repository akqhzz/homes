'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Check, Plus } from 'lucide-react';
import { useSavedStore } from '@/store/savedStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import Button from '@/components/atoms/Button';

interface SaveToCollectionSheetProps {
  listingId: string;
  onClose: () => void;
  onSaved?: () => void;
  anchorRect?: DOMRect | null;
}

export default function SaveToCollectionSheet({ listingId, onClose, onSaved, anchorRect }: SaveToCollectionSheetProps) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const collections = useSavedStore((s) => s.collections);
  const addToCollection = useSavedStore((s) => s.addToCollection);
  const createCollection = useSavedStore((s) => s.createCollection);
  const toggleLike = useSavedStore((s) => s.toggleLike);
  const isLiked = useSavedStore((s) => s.isLiked(listingId));

  const finishSave = (collectionId: string) => {
    if (!isLiked) toggleLike(listingId);
    addToCollection(collectionId, listingId);
    onSaved?.();
    onClose();
  };

  const createAndSave = () => {
    const name = newName.trim();
    if (!name) return;
    const collectionId = createCollection(name);
    finishSave(collectionId);
  };

  const content = (
    <>
      <div className="flex flex-col gap-2.5">
        {collections.map((collection) => {
          const alreadySaved = collection.listings.some((item) => item.listingId === listingId);
          const thumbnailListing = MOCK_LISTINGS.find((item) => item.id === collection.listings[0]?.listingId);
          return (
            <button
              key={collection.id}
              onClick={() => finishSave(collection.id)}
              className="flex min-h-[84px] items-center gap-3 rounded-2xl bg-[#F5F6F7] px-4 py-3 text-left transition-colors hover:bg-[#EBEBEB]"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-[#0F1729]">
                {thumbnailListing?.images[0] ? (
                  <Image src={thumbnailListing.images[0]} alt="" width={56} height={56} className="h-full w-full object-cover" draggable={false} />
                ) : alreadySaved ? (
                  <Check size={16} />
                ) : (
                  <Plus size={16} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="type-label block truncate text-[#0F1729]">{collection.name}</span>
                <span className="block type-caption text-[#9CA3AF]">
                  {alreadySaved ? 'Already Saved Here' : `${collection.listings.length} Listing${collection.listings.length === 1 ? '' : 's'}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {creating ? (
        <div className="mt-4 flex gap-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') createAndSave();
            }}
            placeholder="New Collection..."
            className="h-12 min-w-0 flex-1 rounded-2xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#0F1729]"
            autoFocus
          />
          <Button onClick={createAndSave} size="lg" className="h-12 px-4">
            Create
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="mt-4 flex w-full items-center gap-2 rounded-2xl border border-dashed border-[#D1D5DB] px-4 py-3 text-sm font-medium text-[#6B7280] transition-colors hover:border-[#0F1729] hover:text-[#0F1729]"
        >
          <Plus size={16} />
          New Collection
        </button>
      )}
    </>
  );

  const viewportWidth = typeof window === 'undefined' ? 390 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 844 : window.innerHeight;
  const left = anchorRect ? Math.min(Math.max(anchorRect.right - 320, 16), viewportWidth - 336) : viewportWidth / 2 - 160;
  const top = anchorRect ? Math.min(anchorRect.bottom + 10, viewportHeight - 420) : 96;

  const drawer = (
    <>
      <div className="lg:hidden">
        <MobileDrawer
          title="Save To Collection"
          onClose={onClose}
          heightClassName="max-h-[60dvh]"
          contentClassName="px-4 pb-4"
        >
          {content}
        </MobileDrawer>
      </div>
      <div className="hidden lg:block">
        <button
          type="button"
          aria-label="Close save to collection"
          className="fixed inset-0 z-50 bg-transparent"
          onClick={onClose}
        />
        <div
          className="fixed z-[60] w-80 rounded-3xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,41,0.16)]"
          style={{ left, top }}
          onClick={(event) => event.stopPropagation()}
        >
          <p className="mb-3 type-heading text-[#0F1729]">Save To Collection</p>
          {content}
        </div>
      </div>
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(drawer, document.body);
}
