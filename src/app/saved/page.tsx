'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSavedStore } from '@/store/savedStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import PageShell from '@/components/templates/PageShell';
import Avatar from '@/components/atoms/Avatar';

export default function SavedPage() {
  const { collections, createCollection } = useSavedStore();
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newName, setNewName] = useState('');
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

  return (
    <PageShell>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        {/* Header */}
        <div className="px-4 pt-4 lg:pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-heading text-2xl text-[#0F1729]">Saved</h1>
          </div>
        </div>

        {/* New collection input */}
        <AnimatePresence>
          {showNewCollection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-3 border-b border-[#F5F6F7]"
            >
              <div className="flex gap-2 mt-3">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Collection name..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm outline-none focus:border-[#0F1729] transition-colors"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <button
                  onClick={handleCreate}
                  className="px-4 py-2.5 bg-[#0F1729] text-white text-sm font-semibold rounded-xl hover:bg-[#243761] transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewCollection(false)}
                  className="w-10 h-10 flex items-center justify-center text-[#9CA3AF]"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collections */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <div className="flex flex-col gap-4">
            {collections.map((col) => {
              const previewListings = col.listings
                .slice(0, 3)
                .map((cl) => MOCK_LISTINGS.find((l) => l.id === cl.listingId))
                .filter(Boolean);

              return (
                <motion.button
                  key={col.id}
                  onClick={() => router.push(`/saved/${col.id}`)}
                  className="w-full text-left bg-[#F5F6F7] rounded-3xl overflow-hidden hover:bg-[#EBEBEB] transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Preview collage */}
                  <div className="relative h-52 bg-[#E5E7EB] overflow-hidden">
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

                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0F1729] truncate">{col.name}</p>
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
                </motion.button>
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
    </PageShell>
  );
}
