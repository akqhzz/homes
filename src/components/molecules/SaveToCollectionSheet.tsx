'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Check, Ellipsis, Plus } from 'lucide-react';
import { DEFAULT_COLLECTION_ID, useSavedStore } from '@/store/savedStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import CreateInlineField from '@/components/molecules/CreateInlineField';
import RenameDeletePopover from '@/components/molecules/RenameDeletePopover';

interface MenuState {
  collectionId: string;
  right: number;
  bottom: number;
}

interface SaveToCollectionSheetProps {
  listingId: string;
  onClose: () => void;
  onSaved?: (collectionId: string) => void;
  anchorRect?: DOMRect | null;
  excludedCollectionIds?: string[];
}

const DESKTOP_DROPDOWN_MAX_HEIGHT = 360;
const DESKTOP_VIEWPORT_PADDING = 16;

export default function SaveToCollectionSheet({
  listingId,
  onClose,
  onSaved,
  anchorRect,
  excludedCollectionIds = [],
}: SaveToCollectionSheetProps) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const collections = useSavedStore((s) => s.collections);
  const addToCollection = useSavedStore((s) => s.addToCollection);
  const createCollection = useSavedStore((s) => s.createCollection);
  const renameCollection = useSavedStore((s) => s.renameCollection);
  const deleteCollection = useSavedStore((s) => s.deleteCollection);
  const saveListing = useSavedStore((s) => s.saveListing);
  const isLiked = useSavedStore((s) => s.isLiked(listingId));

  const finishSave = (collectionId: string) => {
    if (!isLiked) saveListing(listingId);
    addToCollection(collectionId, listingId);
    onSaved?.(collectionId);
    onClose();
  };

  const createAndSave = () => {
    const name = newName.trim();
    if (!name) return;
    const collectionId = createCollection(name);
    finishSave(collectionId);
  };

  const closeMenu = () => {
    setMenuState(null);
    setConfirmDeleteId(null);
  };

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>, collectionId: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (menuState?.collectionId === collectionId) {
      closeMenu();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuState({
      collectionId,
      right: window.innerWidth - rect.right,
      bottom: window.innerHeight - rect.top + 4,
    });
    setConfirmDeleteId(null);
  };

  const startRename = (collectionId: string, name: string) => {
    closeMenu();
    setRenamingId(collectionId);
    setRenameName(name);
  };

  const finishRename = () => {
    const name = renameName.trim();
    if (!renamingId) return;
    if (!name) {
      setRenamingId(null);
      setRenameName('');
      return;
    }
    renameCollection(renamingId, name);
    setRenamingId(null);
    setRenameName('');
  };

  const requestDelete = (collectionId: string) => {
    setConfirmDeleteId(collectionId);
  };

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    deleteCollection(confirmDeleteId);
    if (renamingId === confirmDeleteId) {
      setRenamingId(null);
      setRenameName('');
    }
    closeMenu();
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
          const isDefaultCollection = collection.id === DEFAULT_COLLECTION_ID;
          const alreadySaved =
            !excludedCollectionIds.includes(collection.id) &&
            collection.listings.some((item) => item.listingId === listingId);
          const thumbnailListing = MOCK_LISTINGS.find((item) => item.id === collection.listings[0]?.listingId);
          return (
            <div
              key={collection.id}
              className="flex min-h-[84px] items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-[var(--color-text-primary)]">
                {thumbnailListing?.images[0] ? (
                  <Image src={thumbnailListing.images[0]} alt="" width={56} height={56} className="h-full w-full object-cover" draggable={false} />
                ) : alreadySaved ? (
                  <Check size={16} />
                ) : (
                  <Plus size={16} />
                )}
              </span>
              <div
                role="button"
                tabIndex={0}
                onClick={() => finishSave(collection.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    finishSave(collection.id);
                  }
                }}
                className="min-w-0 flex flex-1 items-start gap-3"
              >
                <span className="min-w-0 flex-1">
                  {renamingId === collection.id ? (
                    <div className="flex h-8 items-center rounded-xl border border-[var(--color-border)] bg-white pl-3 pr-1.5">
                      <input
                        value={renameName}
                        onChange={(event) => setRenameName(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if (event.key === 'Enter') finishRename();
                          if (event.key === 'Escape') {
                            setRenamingId(null);
                            setRenameName('');
                          }
                        }}
                        onBlur={finishRename}
                        className="type-body min-w-0 flex-1 bg-transparent text-[var(--color-text-primary)] outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          finishRename();
                        }}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
                        aria-label="Finish rename"
                      >
                        <Check size={13} />
                      </button>
                    </div>
                  ) : (
                    <span className="type-heading-sm block truncate text-[var(--color-text-primary)]">{collection.name}</span>
                  )}
                  <span className="block type-caption text-[var(--color-text-tertiary)]">
                    {alreadySaved ? 'Already Saved Here' : `${collection.listings.length} Listing${collection.listings.length === 1 ? '' : 's'}`}
                  </span>
                </span>
                {!isDefaultCollection && (
                  <button
                    type="button"
                    onClick={(event) => openMenu(event, collection.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-white hover:text-[var(--color-text-primary)]"
                    aria-label="Collection options"
                  >
                    <Ellipsis size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const viewportWidth = typeof window === 'undefined' ? 390 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 844 : window.innerHeight;
  const left = anchorRect ? Math.min(Math.max(anchorRect.right - 320, 16), viewportWidth - 336) : viewportWidth / 2 - 160;
  const preferredTop = anchorRect ? anchorRect.bottom + 10 : 96;
  const top = Math.max(
    DESKTOP_VIEWPORT_PADDING,
    Math.min(preferredTop, viewportHeight - DESKTOP_DROPDOWN_MAX_HEIGHT - DESKTOP_VIEWPORT_PADDING)
  );

  const drawer = (
    <>
      <div className="lg:hidden">
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
          className="fixed inset-0 z-50 bg-transparent"
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
          className="fixed z-[60] max-h-[360px] w-80 overflow-y-auto rounded-3xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,41,0.16)]"
          style={{ left, top }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <p className="mb-3 type-heading text-[var(--color-text-primary)]">Save To Collection</p>
          {content}
        </div>
      </div>
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(
    <>
      {drawer}
      {menuState && (
        <RenameDeletePopover
          open
          confirmOpen={!!confirmDeleteId}
          right={menuState.right}
          bottom={menuState.bottom}
          deleteTitle="Delete collection?"
          deleteDescription="This will remove the collection and its saved listing references."
          onClose={closeMenu}
          onRename={() => {
            const active = collections.find((collection) => collection.id === menuState.collectionId);
            if (active) startRename(active.id, active.name);
          }}
          onRequestDelete={() => requestDelete(menuState.collectionId)}
          onCancelDelete={() => setConfirmDeleteId(null)}
          onConfirmDelete={confirmDelete}
        />
      )}
    </>,
    document.body
  );
}
