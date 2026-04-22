'use client';
import { useEffect, useState } from 'react';
import { Check, Ellipsis, Pencil, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSavedStore } from '@/store/savedStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import PageShell from '@/components/templates/PageShell';
import Avatar from '@/components/atoms/Avatar';

export default function SavedPage() {
  const { collections, createCollection, renameCollection, deleteCollection } = useSavedStore();
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newName, setNewName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleCreateIntent = () => setShowNewCollection(true);
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
    setRenamingId(id);
    setRenameName(name);
  };

  const finishRename = () => {
    const name = renameName.trim();
    if (!renamingId || !name) return;
    renameCollection(renamingId, name);
    setRenamingId(null);
    setRenameName('');
  };

  return (
    <PageShell showBottomNav={!showNewCollection}>
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

                    <div className="px-4 py-3 pr-14 flex items-center justify-between">
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
                        <div className="flex -space-x-1.5 ml-3">
                          {col.collaborators.slice(0, 3).map((c) => (
                            <Avatar key={c.id} src={c.avatar} name={c.name} size="sm" className="border-2 border-[#F5F6F7]" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId((value) => (value === col.id ? null : col.id));
                    }}
                    className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#6B7280] shadow-sm"
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
                        className="absolute bottom-12 right-3 z-20 w-36 rounded-2xl bg-white p-1.5 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]"
                      >
                        <button
                          onClick={() => startRename(col.id, col.name)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-[#0F1729] hover:bg-[#F5F6F7]"
                        >
                          <Pencil size={14} />
                          Rename
                        </button>
                        <button
                          onClick={() => {
                            deleteCollection(col.id);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-[#EF4444] hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 px-4 pt-1 lg:hidden"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto flex max-w-[420px] items-center gap-2 rounded-full bg-white p-1.5 shadow-[0_4px_18px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.05)]">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name..."
                className="h-11 min-w-0 flex-1 rounded-full bg-[#F5F6F7] px-4 text-sm outline-none focus:bg-white focus:shadow-[inset_0_0_0_1px_#0F1729]"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <button onClick={handleCreate} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F1729] text-white">
                <Check size={17} />
              </button>
              <button
                onClick={() => setShowNewCollection(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-[#9CA3AF]"
              >
                <X size={17} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
