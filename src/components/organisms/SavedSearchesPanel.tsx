'use client';
import { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { MOCK_SAVED_SEARCHES } from '@/lib/mock-data';
import { useUIStore } from '@/store/uiStore';
import { useSearchStore } from '@/store/searchStore';
import Button from '@/components/atoms/Button';
import MobileDrawer from '@/components/molecules/MobileDrawer';

interface SavedSearchesPanelProps {
  hasActiveCriteria?: boolean;
}

export default function SavedSearchesPanel({ hasActiveCriteria }: SavedSearchesPanelProps) {
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const { selectedLocations } = useSearchStore();
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const canSaveCurrent = hasActiveCriteria ?? activeFilterCount() > 0;
  const [newSearchName, setNewSearchName] = useState('');
  const [saving, setSaving] = useState(canSaveCurrent);

  const handleLoadSearch = () => {
    // In real app: update search store state
    setActivePanel('none');
  };

  const handleSaveCurrent = () => {
    if (!newSearchName.trim()) return;
    setSaving(false);
    setNewSearchName('');
    setActivePanel('none');
  };

  return (
    <MobileDrawer
      title="Saved Searches"
      onClose={() => setActivePanel('none')}
      heightClassName="h-[74dvh]"
    >
      {/* Save current search */}
      <div className="px-4 py-4 border-b border-[#F5F6F7]">
        <p className="text-sm font-semibold text-[#0F1729] mb-3">Save current search</p>
        {saving ? (
          <div className="flex gap-2">
            <input
              value={newSearchName}
              onChange={(e) => setNewSearchName(e.target.value)}
              placeholder="Search name..."
              className="h-12 flex-1 rounded-2xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#0F1729]"
              autoFocus={canSaveCurrent}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveCurrent()}
            />
            <Button size="lg" onClick={handleSaveCurrent} className="h-12 px-5">Save</Button>
          </div>
        ) : (
          <button
            onClick={() => setSaving(true)}
            className="flex items-center gap-2 w-full px-4 py-3 border border-dashed border-[#D1D5DB] rounded-xl text-sm text-[#6B7280] hover:border-[#0F1729] hover:text-[#0F1729] transition-colors"
          >
            <Plus size={16} />
            Save &quot;{selectedLocations.length > 0 ? selectedLocations.map(l => l.name).join(', ') : 'current search'}&quot;
          </button>
        )}
      </div>

      {/* Saved searches list */}
      <div className="px-4 py-4">
        <p className="text-sm font-semibold text-[#0F1729] mb-3">My Searches</p>
        <div className="flex flex-col gap-3">
          {MOCK_SAVED_SEARCHES.map((search) => (
            <button
              key={search.id}
              onClick={handleLoadSearch}
              className="flex items-center gap-3 p-3 bg-[#F5F6F7] rounded-2xl text-left hover:bg-[#EBEBEB] transition-colors"
            >
              {search.thumbnail && (
                <img
                  src={search.thumbnail}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#0F1729]">{search.name}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  {search.locations.map(l => l.name).join(', ')}
                </p>
                {search.newListingsCount && search.newListingsCount > 0 && (
                  <span className="inline-flex items-center mt-1.5 px-2 py-0.5 bg-[#0F1729] text-white text-xs font-medium rounded-full">
                    {search.newListingsCount} new
                  </span>
                )}
              </div>
              <ChevronRight size={18} className="text-[#9CA3AF] flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </MobileDrawer>
  );
}
