'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, Ellipsis } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { DEFAULT_COLLECTION_ID, useSavedStore } from '@/store/savedStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { Collection } from '@/lib/types';
import PageShell from '@/components/templates/PageShell';
import Avatar from '@/components/atoms/Avatar';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import CreateInlineField from '@/components/molecules/CreateInlineField';
import RenameDeletePopover from '@/components/molecules/RenameDeletePopover';
import CollectionWorkspaceHeader from '@/components/organisms/CollectionWorkspaceHeader';
import { EmptyCollectionIllustration } from '@/components/organisms/CollectionListingsGrid';

interface MenuState {
  colId: string;
  right: number;
  bottom: number;
}

type DesktopCreateAnchor = 'header' | 'empty' | null;

export default function SavedPage() {
  const { collections, createCollection, renameCollection, deleteCollection } = useSavedStore();
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [desktopCreateAnchor, setDesktopCreateAnchor] = useState<DesktopCreateAnchor>(null);
  const [newName, setNewName] = useState('');
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const desktopCreateRef = useRef<HTMLDivElement>(null);
  const emptyStateCreateRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleCreateIntent = () => {
      setNewName('');
      setCreatingCollection(true);
      setShowNewCollection(true);
    };
    window.addEventListener('homes:create-collection', handleCreateIntent);
    return () => window.removeEventListener('homes:create-collection', handleCreateIntent);
  }, []);

  useEffect(() => {
    if (!desktopCreateAnchor) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (
        !desktopCreateRef.current?.contains(event.target as Node) &&
        !emptyStateCreateRef.current?.contains(event.target as Node)
      ) {
        setDesktopCreateAnchor(null);
        setCreatingCollection(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [desktopCreateAnchor]);

  const closeMenu = () => {
    setMenuState(null);
    setConfirmDeleteId(null);
  };

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>, colId: string) => {
    event.stopPropagation();
    if (menuState?.colId === colId) { closeMenu(); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuState({ colId, right: window.innerWidth - rect.right, bottom: window.innerHeight - rect.top + 4 });
    setConfirmDeleteId(null);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCollection(newName.trim());
    setNewName('');
    setCreatingCollection(false);
    setShowNewCollection(false);
    setDesktopCreateAnchor(null);
  };

  const startRename = (id: string, name: string) => {
    closeMenu();
    setRenamingId(id);
    setRenameName(name);
  };

  const finishRename = () => {
    const name = renameName.trim();
    if (!renamingId) return;
    if (!name) { setRenamingId(null); setRenameName(''); return; }
    renameCollection(renamingId, name);
    setRenamingId(null);
    setRenameName('');
  };

  const requestDelete = (id: string) => {
    setConfirmDeleteId(id);
    // keep menuState so the delete confirm uses the same position
  };

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    deleteCollection(confirmDeleteId);
    closeMenu();
  };

  const toggleDesktopCreate = (anchor: Exclude<DesktopCreateAnchor, null>) => {
    setDesktopCreateAnchor((current) => (current === anchor ? null : anchor));
    setCreatingCollection(false);
    setNewName('');
  };

  const isMenuOpen = !!menuState && !confirmDeleteId;
  const isConfirmOpen = !!menuState && !!confirmDeleteId;

  return (
    <PageShell desktopWide showDesktopHeader={false}>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-4 pb-0 lg:w-full lg:px-6 lg:pt-6">
          <CollectionWorkspaceHeader
            title="Collections"
            titleClassName="type-title lg:text-[1.875rem]"
            subtitleClassName="type-body"
            subtitle={`${collections.length} collection${collections.length === 1 ? '' : 's'}`}
            showBackButton
            hideSubtitleOnMobile
            rightSlot={(
              <div ref={desktopCreateRef} className="relative">
                <button
                  type="button"
                  onClick={() => toggleDesktopCreate('header')}
                  className="relative flex h-11 items-center gap-2 rounded-full bg-white px-4 type-btn text-[var(--color-text-primary)] shadow-[var(--shadow-control)] transition-colors hover:bg-[var(--color-surface)] no-select"
                >
                  Create New
                </button>
                {desktopCreateAnchor === 'header' && (
                  <div className="absolute right-0 top-[3.25rem] z-20 w-80 rounded-[22px] bg-white p-4 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
                    <CreateInlineField
                      open
                      onOpenChange={(open) => {
                        if (!open) {
                          setDesktopCreateAnchor(null);
                          setNewName('');
                        }
                      }}
                      value={newName}
                      onValueChange={setNewName}
                      placeholder="Collection name..."
                      collapsedLabel="New Collection"
                      onSubmit={handleCreate}
                      autoFocus
                      submitLabel="Create"
                      className="mb-0"
                    />
                  </div>
                )}
              </div>
            )}
          />
        </div>

        {/* Collections */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 lg:w-full lg:px-6 lg:pt-8">
          {collections.length === 0 ? (
            <div className="flex min-h-[min(52vh,32rem)] w-full items-center justify-center lg:min-h-[calc(100vh-16rem)]">
              <div className="text-center">
                <EmptyCollectionIllustration />
                <p className="type-heading text-[var(--color-text-primary)]">No collections yet</p>
                <p className="mt-1 type-body text-[var(--color-text-tertiary)]">Create a collection to organize homes you want to revisit, compare, or share.</p>
                <div ref={emptyStateCreateRef} className="relative mt-4 inline-flex">
                  <button
                    type="button"
                    onClick={() => toggleDesktopCreate('empty')}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-text-primary)] px-4 type-btn text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)]"
                  >
                    Create New
                  </button>
                  {desktopCreateAnchor === 'empty' && (
                    <div className="absolute left-1/2 top-[3.25rem] z-20 w-80 -translate-x-1/2 rounded-[22px] bg-white p-4 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
                      <CreateInlineField
                        open
                        onOpenChange={(open) => {
                          if (!open) {
                            setDesktopCreateAnchor(null);
                            setNewName('');
                          }
                        }}
                        value={newName}
                        onValueChange={setNewName}
                        placeholder="Collection name..."
                        collapsedLabel="New Collection"
                        onSubmit={handleCreate}
                        autoFocus
                        submitLabel="Create"
                        className="mb-0"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="layout-content-wide">
              <div className="grid w-full grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 3xl:grid-cols-6">
              {collections.map((col) => {
              const coverImages = getCollectionCoverImages(col);
              const isDefaultCollection = col.id === DEFAULT_COLLECTION_ID;

              return (
                <motion.article
                  key={col.id}
                  className="relative w-full min-w-0 overflow-visible rounded-2xl bg-white text-left shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] transition-transform hover:-translate-y-0.5"
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    onClick={() => router.push(`/saved/${col.id}`)}
                    className="block w-full overflow-hidden rounded-2xl text-left"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') router.push(`/saved/${col.id}`);
                    }}
                  >
                    <CollectionCoverGrid images={coverImages} />

                    {/* pr-12 reserves space for the absolutely-positioned ... button */}
                    <div className="px-4 pb-3.5 pt-2 pr-12 flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        {renamingId === col.id ? (
                          <div className="flex h-9 items-center rounded-xl border border-[var(--color-border)] bg-white pl-3 pr-1.5">
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
                                finishRename();
                              }}
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
                              aria-label="Finish rename"
                            >
                              <Check size={13} />
                            </button>
                          </div>
                        ) : (
                        <p className="truncate type-heading-sm text-[var(--color-text-primary)]">{col.name}</p>
                        )}
                        <p className="type-caption text-[var(--color-text-tertiary)] mt-0.5">
                          {col.listings.length} listing{col.listings.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {col.collaborators && col.collaborators.length > 0 && (
                        <div className="flex -space-x-1.5">
                          {col.collaborators.slice(0, 3).map((c) => (
                            <Avatar key={c.id} src={c.avatar} name={c.name} size="sm" className="border-2 border-[var(--color-surface)]" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ... button — outside overflow-hidden, positioned at article level */}
                  {!isDefaultCollection && (
                    <button
                      onClick={(event) => openMenu(event, col.id)}
                      className="absolute bottom-3 right-1 flex h-12 w-12 items-center justify-center rounded-full text-[var(--color-text-secondary)]"
                      aria-label="Collection options"
                    >
                      <Ellipsis size={17} />
                    </button>
                  )}
                </motion.article>
              );
            })}
              </div>
            </div>
          )}
        </div>
      </div>

      {menuState && (
        <RenameDeletePopover
          open={isMenuOpen || isConfirmOpen}
          confirmOpen={isConfirmOpen}
          right={menuState.right}
          bottom={menuState.bottom}
          deleteTitle="Delete collection?"
          deleteDescription="This removes the collection, not the listings."
          onClose={closeMenu}
          onRename={() => startRename(menuState.colId, collections.find((c) => c.id === menuState.colId)?.name ?? '')}
          onRequestDelete={() => requestDelete(menuState.colId)}
          onCancelDelete={() => setConfirmDeleteId(null)}
          onConfirmDelete={confirmDelete}
        />
      )}

      <AnimatePresence>
        {showNewCollection && (
          <MobileDrawer
            title="Create Collection"
            onClose={() => {
              setShowNewCollection(false);
              setCreatingCollection(false);
              setNewName('');
            }}
            heightClassName="max-h-[50dvh]"
            contentClassName="px-4 pb-4"
          >
            <CreateInlineField
              open={creatingCollection}
              onOpenChange={setCreatingCollection}
              value={newName}
              onValueChange={setNewName}
              placeholder="Collection name..."
              collapsedLabel="Create new collection"
              onSubmit={handleCreate}
              autoFocus={creatingCollection}
            />
          </MobileDrawer>
        )}
      </AnimatePresence>
    </PageShell>
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
