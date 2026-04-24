'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Ellipsis, Pencil, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSavedStore } from '@/store/savedStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import PageShell from '@/components/templates/PageShell';
import Avatar from '@/components/atoms/Avatar';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import Button from '@/components/atoms/Button';
import CollectionWorkspaceHeader from '@/components/organisms/CollectionWorkspaceHeader';

interface MenuState {
  colId: string;
  right: number;
  bottom: number;
}

export default function SavedPage() {
  const { collections, createCollection, renameCollection, deleteCollection } = useSavedStore();
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newName, setNewName] = useState('');
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleCreateIntent = () => {
      setNewName('');
      setCreatingCollection(false);
      setShowNewCollection(true);
    };
    window.addEventListener('homes:create-collection', handleCreateIntent);
    return () => window.removeEventListener('homes:create-collection', handleCreateIntent);
  }, []);

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

  const isMenuOpen = !!menuState && !confirmDeleteId;
  const isConfirmOpen = !!menuState && !!confirmDeleteId;

  return (
    <PageShell desktopWide showDesktopHeader={false}>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-4 pb-0 lg:w-full lg:px-6 lg:pt-6">
          <CollectionWorkspaceHeader
            title="Collections"
            subtitle={`${collections.length} collection${collections.length === 1 ? '' : 's'}`}
            showBackButton
            hideSubtitleOnMobile
          />
        </div>

        {/* Collections */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 lg:w-full lg:px-6 lg:pt-8">
          <div className="layout-content-wide grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4 2xl:grid-cols-5">
            {collections.map((col) => {
              const firstListing = col.listings.length > 0
                ? MOCK_LISTINGS.find((l) => l.id === col.listings[0].listingId)
                : null;

              return (
                <motion.article
                  key={col.id}
                  className="relative w-full overflow-visible rounded-2xl bg-white text-left shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] transition-transform hover:-translate-y-0.5 lg:w-80"
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
                    {/* Cover — first listing image, full fill */}
                    <div className="relative aspect-[16/11] overflow-hidden bg-[#E5E7EB] sm:aspect-[4/3]">
                      {firstListing ? (
                        <Image src={firstListing.images[0]} alt="" fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏠</div>
                      )}
                    </div>

                    {/* pr-12 reserves space for the absolutely-positioned ... button */}
                    <div className="px-4 pb-3.5 pt-2 pr-12 flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        {renamingId === col.id ? (
                          <input
                            value={renameName}
                            onChange={(event) => setRenameName(event.target.value)}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                              event.stopPropagation();
                              if (event.key === 'Enter') finishRename();
                              if (event.key === 'Escape') setRenamingId(null);
                            }}
                            onBlur={finishRename}
                            className="h-9 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#0F1729] outline-none focus:border-[#0F1729]"
                            autoFocus
                          />
                        ) : (
                          <p className="truncate type-heading text-[#0F1729]">{col.name}</p>
                        )}
                        <p className="type-caption text-[#9CA3AF] mt-0.5">
                          {col.listings.length} listing{col.listings.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {col.collaborators && col.collaborators.length > 0 && (
                        <div className="flex -space-x-1.5">
                          {col.collaborators.slice(0, 3).map((c) => (
                            <Avatar key={c.id} src={c.avatar} name={c.name} size="sm" className="border-2 border-[#F5F6F7]" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ... button — outside overflow-hidden, positioned at article level */}
                  <button
                    onClick={(event) => openMenu(event, col.id)}
                    className="absolute bottom-3 right-1 flex h-12 w-12 items-center justify-center rounded-full text-[#6B7280]"
                    aria-label="Collection options"
                  >
                    <Ellipsis size={17} />
                  </button>
                </motion.article>
              );
            })}

            {collections.length === 0 && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🏠</div>
                <p className="type-label text-[#0F1729]">No collections yet</p>
                <p className="type-body text-[#9CA3AF] mt-1">Save listings to create your first collection</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portal: dropdown menus rendered in <body> so they're never clipped by scroll
          containers or hidden behind toolbars. Backdrop stops clicks from reaching cards. */}
      {typeof document !== 'undefined' && (isMenuOpen || isConfirmOpen) && createPortal(
        <>
          <div
            className="fixed inset-0 z-[45]"
            onClick={(e) => { e.stopPropagation(); closeMenu(); }}
          />
          <AnimatePresence>
            {isMenuOpen && menuState && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="fixed z-[50] w-36 rounded-2xl bg-white p-1.5 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]"
                style={{ bottom: menuState.bottom, right: menuState.right }}
              >
                <button
                  onClick={() => startRename(menuState.colId, collections.find(c => c.id === menuState.colId)?.name ?? '')}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-[#0F1729] hover:bg-[#F5F6F7]"
                >
                  <Pencil size={14} />
                  Rename
                </button>
                <button
                  onClick={() => requestDelete(menuState.colId)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-[#EF4444] hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {isConfirmOpen && menuState && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="fixed z-[50] w-56 rounded-2xl bg-white p-3 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]"
                style={{ bottom: menuState.bottom, right: menuState.right }}
              >
                <p className="type-label text-[#0F1729]">Delete collection?</p>
                <p className="mt-1 type-caption text-[#6B7280]">This removes the collection, not the listings.</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="h-9 flex-1 rounded-full bg-[#F5F6F7] type-caption font-semibold text-[#0F1729]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="h-9 flex-1 rounded-full bg-[#EF4444] type-caption font-semibold text-white"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body
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
            {creatingCollection ? (
              <div className="flex gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Collection name..."
                  className="h-12 min-w-0 flex-1 rounded-2xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#0F1729]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') {
                      setCreatingCollection(false);
                      setNewName('');
                    }
                  }}
                />
                <Button onClick={handleCreate} size="lg" className="h-12 px-5">Create</Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreatingCollection(true)}
                className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[#D1D5DB] px-4 py-3 text-sm text-[#6B7280] transition-colors hover:border-[#0F1729] hover:text-[#0F1729]"
              >
                <Plus size={16} />
                Create new collection
              </button>
            )}
          </MobileDrawer>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
