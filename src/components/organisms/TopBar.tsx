'use client';
import { Search, Layers, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';

export default function TopBar() {
  const { selectedLocations } = useSearchStore();
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const { activePanel, setActivePanel, setAreaSelectMode } = useUIStore();

  const filterCount = activeFilterCount();
  const locationLabel =
    selectedLocations.length === 0
      ? 'Where?'
      : `${selectedLocations.length} area${selectedLocations.length === 1 ? '' : 's'}`;

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex justify-center">
      <div className="flex w-full max-w-[360px] items-center gap-2">
      {/* Search pill */}
      <motion.div layoutId="map-search-bar" className="flex-1 flex items-center gap-2.5 bg-white rounded-full px-4 py-2.5 shadow-[var(--shadow-control)] min-h-[44px] no-select">
        <button
          onClick={() => setActivePanel('search')}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <Search size={17} className="text-[#9CA3AF] flex-shrink-0" />
          <span className={cn(
            'text-sm font-medium flex-1 truncate',
            selectedLocations.length === 0 ? 'text-[#9CA3AF]' : 'text-[#0F1729]'
          )}>
            {locationLabel}
          </span>
        </button>
        <button
          onClick={() => {
            setAreaSelectMode(true);
            setActivePanel('area-select');
          }}
          className="flex-shrink-0 text-[#9CA3AF] hover:text-[#0F1729] transition-colors p-0.5"
        >
          <Layers size={17} />
        </button>
      </motion.div>

      {/* Filter button */}
      <motion.button
        onClick={() => setActivePanel('filter')}
        animate={{ opacity: activePanel === 'search' ? 0 : 1, scale: activePanel === 'search' ? 0.92 : 1 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        className={cn(
          'w-11 h-11 rounded-full flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] transition-colors no-select relative',
          activePanel === 'search' && 'pointer-events-none',
          filterCount > 0 ? 'bg-white ring-1 ring-[#374151]' : 'bg-white'
        )}
      >
        <SlidersHorizontal size={18} className="text-[#0F1729]" />
        {filterCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#374151] px-1 text-[8px] font-bold leading-none text-white">
            {filterCount}
          </span>
        )}
      </motion.button>
      </div>
    </div>
  );
}
