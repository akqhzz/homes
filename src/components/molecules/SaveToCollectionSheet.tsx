'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Plus } from 'lucide-react';
import { useSavedStore } from '@/store/savedStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import Button from '@/components/atoms/Button';

interface SaveToCollectionSheetProps {
  listingId: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function SaveToCollectionSheet({ listingId, onClose, onSaved }: SaveToCollectionSheetProps) {
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

  const drawer = (
    <MobileDrawer
      title="Save to collection"
      onClose={onClose}
      heightClassName="max-h-[60dvh]"
      contentClassName="px-4 pb-4"
    >
      <div className="flex flex-col gap-2.5">
        {collections.map((collection) => {
          const alreadySaved = collection.listings.some((item) => item.listingId === listingId);
          const thumbnailListing = MOCK_LISTINGS.find((item) => item.id === collection.listings[0]?.listingId);
          return (
            <button
              key={collection.id}
              onClick={() => finishSave(collection.id)}
              className="flex min-h-[84px] items-center gap-3 rounded-2xl bg-[#F5F6F7] px-4 py-3 text-left"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-[#0F1729]">
                {thumbnailListing?.images[0] ? (
                  <img src={thumbnailListing.images[0]} alt="" className="h-full w-full object-cover" draggable={false} />
                ) : alreadySaved ? (
                  <Check size={16} />
                ) : (
                  <Plus size={16} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#0F1729]">{collection.name}</span>
                <span className="block text-xs text-[#9CA3AF]">
                  {alreadySaved ? 'Already saved here' : `${collection.listings.length} listing${collection.listings.length === 1 ? '' : 's'}`}
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
            placeholder="New collection..."
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
          New collection
        </button>
      )}
    </MobileDrawer>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(drawer, document.body);
}
