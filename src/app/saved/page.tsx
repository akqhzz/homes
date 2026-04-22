'use client';
import { useEffect, useRef, useState } from 'react';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSavedStore } from '@/store/savedStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import PageShell from '@/components/templates/PageShell';
import Avatar from '@/components/atoms/Avatar';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import Button from '@/components/atoms/Button';

export default function SavedPage() {
  const { collections, createCollection, renameCollection, deleteCollection } = useSavedStore();
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newName, setNewName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId && !confirmDeleteId) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
        setConfirmDeleteId(null);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [openMenuId, confirmDeleteId]);

  useEffect(() => {
    const handleCreateIntent = () => {
      setNewName('');
      setShowNewCollection(true);
    };
    window.addEventListener('homes:create-collection', handleCreateIntent);
    return () => window.removeEventListener('homes:create-collection', handleCreateIntent);
  }, []);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCollection(newName.trim());
    setNewName('');
    setShowNewCollection(false);
  };

  const startRename = (id: string, name: string) => {
    setOpenMenuId(null);
    setConfirmDeleteId(null);
    setRenamingId(id);
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

  const requestDelete = (id: string) => {
    setOpenMenuId(null);
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    deleteCollection(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  return (
    <PageShell>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        {/* Header */}
        <div className="px-4 pt-4 lg:pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-heading text-2xl text-[#0F1729]">Saved</h1>
          </div>
        </div>

        {/* Collections */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <div className="flex flex-col gap-4">
            {collections.map((col) => {
              const previewListings = col.listings
                .slice(0, 3)
                .map((cl) => MOCK_LISTINGS.find((l) => l.id === cl.listingId))
                .filter(Boolean);

              return (
                <motion.article
                  key={col.id}
                  className="relative w-full overflow-visible rounded-3xl bg-[#F5F6F7] text-left transition-colors hover:bg-[#EBEBEB]"
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    onClick={() => router.push(`/saved/${col.id}`)}
                    className="block w-full overflow-hidden rounded-3xl text-left"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') router.push(`/saved/${col.id}`);
                    }}
                  >
                    {/* Preview collage */}
                    <div className="relative h-52 overflow-hidden bg-[#E5E7EB]">
                      {previewListings.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏠</div>
                      )}
                      {previewListings.length === 1 && (
                        <img src={previewListings[0]!.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                      {previewListings.length >= 2 && (
                        <div className="flex w-full h-full gap-0.5">
                          <img
                            src={previewListings[0]!.images[0]}
                            alt=""
                            className="h-full object-cover"
                            style={{ width: '48%', transform: 'rotate(-2deg) scale(1.06)', transformOrigin: 'right center' }}
                          />
                          <img
                            src={previewListings[1]!.images[0]}
                            alt=""
                            className="h-full object-cover z-10 shadow-lg"
                            style={{ width: '40%', transform: 'scale(1.04)' }}
                          />
                          {previewListings[2] && (
                            <img
                              src={previewListings[2]!.images[0]}
                              alt=""
                              className="h-full object-cover"
                              style={{ flex: 1, transform: 'rotate(2deg) scale(1.06)', transformOrigin: 'left center' }}
                            />
                          )}
                        </div>
                      )}
                      {col.listings.length > 5 && (
                        <div className="absolute bottom-3 right-3 bg-[#E5E7EB]/90 text-[#6B7280] text-xs font-semibold px-2.5 py-1 rounded-xl">
                          {col.listings.length} New
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3 flex items-start gap-2">
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
                          <p className="font-bold text-[#0F1729] truncate">{col.name}</p>
                        )}
                        <p className="text-xs text-[#9CA3AF] mt-0.5">
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
                      <div ref={openMenuId === col.id || confirmDeleteId === col.id ? menuRef : undefined} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setConfirmDeleteId(null);
                            setOpenMenuId((value) => (value === col.id ? null : col.id));
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[#6B7280]"
                          aria-label="Collection options"
                        >
                          <Ellipsis size={17} />
                        </button>
                        <AnimatePresence>
                          {openMenuId === col.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 6, scale: 0.98 }}
                              transition={{ duration: 0.16, ease: 'easeOut' }}
                              className="absolute right-0 top-9 z-20 w-36 rounded-2xl bg-white p-1.5 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]"
                            >
                              <button
                                onClick={() => startRename(col.id, col.name)}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-[#0F1729] hover:bg-[#F5F6F7]"
                              >
                                <Pencil size={14} />
                                Rename
                              </button>
                              <button
                                onClick={() => requestDelete(col.id)}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-[#EF4444] hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <AnimatePresence>
                          {confirmDeleteId === col.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 6, scale: 0.98 }}
                              transition={{ duration: 0.16, ease: 'easeOut' }}
                              className="absolute right-0 top-9 z-20 w-56 rounded-2xl bg-white p-3 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]"
                            >
                              <p className="font-semibold text-[#0F1729]">Delete collection?</p>
                              <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">This removes the collection, not the listings.</p>
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="h-9 flex-1 rounded-full bg-[#F5F6F7] text-xs font-semibold text-[#0F1729]"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={confirmDelete}
                                  className="h-9 flex-1 rounded-full bg-[#EF4444] text-xs font-semibold text-white"
                                >
                                  Delete
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}

            {collections.length === 0 && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🏠</div>
                <p className="font-semibold text-[#0F1729]">No collections yet</p>
                <p className="text-sm text-[#9CA3AF] mt-1">Save listings to create your first collection</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showNewCollection && (
          <MobileDrawer
            title="New collection"
            onClose={() => setShowNewCollection(false)}
            heightClassName="max-h-[50dvh]"
            contentClassName="px-4 pb-4"
          >
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name..."
                className="h-12 min-w-0 flex-1 rounded-2xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#0F1729]"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button onClick={handleCreate} size="lg" className="h-12 px-5">Create</Button>
            </div>
          </MobileDrawer>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
