'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSavedStore } from '@/store/savedStore';
import PageShell from '@/components/layout/PageShell';
import MobileDrawer from '@/components/ui/MobileDrawer';
import CreateInlineField from '@/components/ui/CreateInlineField';
import RenameDeletePopover from '@/components/ui/RenameDeletePopover';
import CollectionWorkspaceHeader from '@/features/collections/components/CollectionWorkspaceHeader';
import { EmptyCollectionIllustration } from '@/features/collections/components/CollectionListingsGrid';
import { useOutsidePointerDown } from '@/hooks/useOutsidePointerDown';
import SavedCollectionCard from '@/features/collections/components/SavedCollectionCard';

interface MenuState {
  colId: string;
  right: number;
  bottom: number;
}

type DesktopCreateAnchor = 'header' | 'empty' | null;

export default function SavedCollectionsPageClient() {
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

  useOutsidePointerDown({
    refs: [desktopCreateRef, emptyStateCreateRef],
    enabled: Boolean(desktopCreateAnchor),
    onOutside: () => {
      setDesktopCreateAnchor(null);
      setCreatingCollection(false);
    },
  });

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
                {collections.map((col) => (
                  <SavedCollectionCard
                    key={col.id}
                    collection={col}
                    isRenaming={renamingId === col.id}
                    renameName={renameName}
                    onRenameNameChange={setRenameName}
                    onFinishRename={finishRename}
                    onCancelRename={() => {
                      setRenamingId(null);
                      setRenameName('');
                    }}
                    onOpen={() => router.push(`/saved/${col.id}`)}
                    onOpenMenu={(event) => openMenu(event, col.id)}
                  />
                ))}
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
