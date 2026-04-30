'use client';
import Image from 'next/image';
import type { MouseEvent } from 'react';
import { Check, Ellipsis } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Collection } from '@/lib/types';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { DEFAULT_COLLECTION_ID } from '@/store/savedStore';
import Avatar from '@/components/ui/Avatar';

interface SavedCollectionCardProps {
  collection: Collection;
  isRenaming: boolean;
  renameName: string;
  onRenameNameChange: (value: string) => void;
  onFinishRename: () => void;
  onCancelRename: () => void;
  onOpen: () => void;
  onOpenMenu: (event: MouseEvent<HTMLButtonElement>) => void;
}

export default function SavedCollectionCard({
  collection,
  isRenaming,
  renameName,
  onRenameNameChange,
  onFinishRename,
  onCancelRename,
  onOpen,
  onOpenMenu,
}: SavedCollectionCardProps) {
  const coverImages = getCollectionCoverImages(collection);
  const isDefaultCollection = collection.id === DEFAULT_COLLECTION_ID;

  return (
    <motion.article
      className="relative w-full min-w-0 overflow-visible rounded-2xl bg-white text-left shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] transition-transform hover:-translate-y-0.5"
      whileTap={{ scale: 0.98 }}
    >
      <div
        onClick={onOpen}
        className="block w-full overflow-hidden rounded-2xl text-left"
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onOpen();
        }}
      >
        <CollectionCoverGrid images={coverImages} />

        <div className="flex items-start gap-2 px-4 pb-3.5 pt-2 pr-12">
          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <div className="flex h-9 items-center rounded-xl border border-[var(--color-border)] bg-white pl-3 pr-1.5">
                <input
                  value={renameName}
                  onChange={(event) => onRenameNameChange(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                    if (event.key === 'Enter') onFinishRename();
                    if (event.key === 'Escape') onCancelRename();
                  }}
                  onBlur={onFinishRename}
                  className="min-w-0 flex-1 bg-transparent font-heading text-sm font-normal text-[var(--color-text-primary)] outline-none"
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
                    onFinishRename();
                  }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
                  aria-label="Finish rename"
                >
                  <Check size={13} />
                </button>
              </div>
            ) : (
              <p className="truncate type-heading-sm text-[var(--color-text-primary)]">{collection.name}</p>
            )}
            <p className="mt-0.5 type-caption text-[var(--color-text-tertiary)]">
              {collection.listings.length} listing{collection.listings.length !== 1 ? 's' : ''}
            </p>
          </div>
          {collection.collaborators && collection.collaborators.length > 0 && (
            <div className="flex -space-x-1.5">
              {collection.collaborators.slice(0, 3).map((collaborator) => (
                <Avatar
                  key={collaborator.id}
                  src={collaborator.avatar}
                  name={collaborator.name}
                  size="sm"
                  className="border-2 border-[var(--color-surface)]"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {!isDefaultCollection && (
        <button
          onClick={onOpenMenu}
          className="absolute bottom-3 right-1 flex h-12 w-12 items-center justify-center rounded-full text-[var(--color-text-secondary)]"
          aria-label="Collection options"
        >
          <Ellipsis size={17} />
        </button>
      )}
    </motion.article>
  );
}

function getCollectionCoverImages(collection: Collection) {
  return [...collection.listings]
    .sort((a, b) => a.order - b.order)
    .map((collectionListing) => MOCK_LISTINGS.find((listing) => listing.id === collectionListing.listingId)?.images[0])
    .filter((image): image is string => Boolean(image))
    .slice(0, 3);
}

function CollectionCoverGrid({ images }: { images: string[] }) {
  return (
    <div className="grid aspect-[16/9] grid-cols-[2fr_1fr] gap-[3px] overflow-hidden bg-white">
      <CollectionCoverSlot image={images[0]} className="h-full" sizes="(max-width: 768px) 66vw, 360px" />
      <div className="grid min-h-0 grid-rows-2 gap-[3px]">
        <CollectionCoverSlot image={images[1]} sizes="(max-width: 768px) 33vw, 180px" />
        <CollectionCoverSlot image={images[2]} sizes="(max-width: 768px) 33vw, 180px" />
      </div>
    </div>
  );
}

function CollectionCoverSlot({
  image,
  className,
  sizes,
}: {
  image?: string;
  className?: string;
  sizes: string;
}) {
  return (
    <div className={`relative min-h-0 overflow-hidden bg-[var(--color-surface)] ${className ?? ''}`}>
      {image && (
        <Image src={image} alt="" fill sizes={sizes} className="object-cover" />
      )}
    </div>
  );
}
