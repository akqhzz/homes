'use client';
import Image from 'next/image';
import type { MouseEvent } from 'react';
import { Check, ChevronRight, Ellipsis, Plus } from 'lucide-react';
import type { Collection } from '@/lib/types';
import { DEFAULT_COLLECTION_ID } from '@/store/savedStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import CreateInlineField from '@/components/ui/CreateInlineField';
import AppImageIcon from '@/components/ui/AppImageIcon';
import { cn } from '@/lib/utils/cn';

interface DesktopCollectionsMenuProps {
  collections: Collection[];
  creatingCollection: boolean;
  newCollectionName: string;
  renamingCollectionId: string | null;
  renameCollectionName: string;
  onCreatingCollectionChange: (open: boolean) => void;
  onNewCollectionNameChange: (name: string) => void;
  onRenameCollectionNameChange: (name: string) => void;
  onCreateCollection: () => void;
  onFinishCollectionRename: () => void;
  onCancelCollectionRename: () => void;
  onOpenCollection: (collectionId: string) => void;
  onOpenCollectionMenu: (event: MouseEvent<HTMLButtonElement>, collectionId: string) => void;
  onShowAllCollections: () => void;
  align?: 'left' | 'right';
}

export default function DesktopCollectionsMenu({
  collections,
  creatingCollection,
  newCollectionName,
  renamingCollectionId,
  renameCollectionName,
  onCreatingCollectionChange,
  onNewCollectionNameChange,
  onRenameCollectionNameChange,
  onCreateCollection,
  onFinishCollectionRename,
  onCancelCollectionRename,
  onOpenCollection,
  onOpenCollectionMenu,
  onShowAllCollections,
  align = 'right',
}: DesktopCollectionsMenuProps) {
  return (
    <div className={cn('absolute top-12 z-40 w-80 rounded-3xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,41,0.16)]', align === 'left' ? 'left-0' : 'right-0')}>
      <CreateInlineField
        open={creatingCollection}
        onOpenChange={onCreatingCollectionChange}
        value={newCollectionName}
        onValueChange={onNewCollectionNameChange}
        placeholder="Collection Name..."
        collapsedLabel="New Collection"
        onSubmit={onCreateCollection}
        autoFocus
        submitStyle="icon"
        submitIcon={<Plus size={16} />}
        className="mb-3"
        collapsedClassName="type-label mb-3 rounded-2xl"
      />
      <div className="flex flex-col gap-2.5">
        {collections.slice(0, 4).map((collection) => {
          const listing = MOCK_LISTINGS.find((item) => item.id === collection.listings[0]?.listingId);
          const isDefaultCollection = collection.id === DEFAULT_COLLECTION_ID;
          return (
            <div
              key={collection.id}
              className="flex min-h-[84px] items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                {listing?.images[0] && (
                  <Image src={listing.images[0]} alt="" fill sizes="56px" className="object-cover" />
                )}
              </span>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onOpenCollection(collection.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenCollection(collection.id);
                  }
                }}
                className="flex min-w-0 flex-1 items-start gap-3"
              >
                <span className="min-w-0 flex-1">
                  {renamingCollectionId === collection.id ? (
                    <div className="flex h-8 items-center rounded-xl border border-[var(--color-border)] bg-white pl-3 pr-1.5">
                      <input
                        value={renameCollectionName}
                        onChange={(event) => onRenameCollectionNameChange(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if (event.key === 'Enter') onFinishCollectionRename();
                          if (event.key === 'Escape') onCancelCollectionRename();
                        }}
                        onBlur={onFinishCollectionRename}
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
                          onFinishCollectionRename();
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
                    {collection.listings.length} Listing{collection.listings.length === 1 ? '' : 's'}
                  </span>
                </span>
                {!isDefaultCollection && (
                  <button
                    type="button"
                    onClick={(event) => onOpenCollectionMenu(event, collection.id)}
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
        <button
          onClick={onShowAllCollections}
          className="flex min-h-[84px] items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-left transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]"
        >
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
            {MOCK_LISTINGS[0]?.images[0] && (
              <Image src={MOCK_LISTINGS[0].images[0]} alt="" fill sizes="56px" className="object-cover" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="type-heading-sm block truncate text-[var(--color-text-primary)]">All Collections</span>
            <span className="block type-caption text-[var(--color-text-tertiary)]">View Your Saved Homes</span>
          </span>
          <ChevronRight size={15} className="shrink-0 text-[var(--color-text-tertiary)]" />
        </button>
      </div>
    </div>
  );
}

export function DesktopCollectionsTrigger() {
  return (
    <span className="inline-flex items-center gap-2">
      <AppImageIcon src="/icons/collection.png" alt="Collections" size={18} className="rounded-[5px]" />
      Collections
    </span>
  );
}
