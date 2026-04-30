'use client';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import DesktopHeader from '@/components/layout/DesktopHeader';
import BottomNav from '@/components/layout/BottomNav';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';

const SearchPanel = dynamic(() => import('@/features/search/components/SearchPanel'), { ssr: false });
const FilterPanel = dynamic(() => import('@/features/search/components/FilterPanel'), { ssr: false });
const SavedSearchesPanel = dynamic(() => import('@/features/saved-searches/components/SavedSearchesPanel'), { ssr: false });

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  showBottomNav?: boolean;
  desktopWide?: boolean;
  showDesktopHeader?: boolean;
  desktopHeaderVariant?: 'default' | 'listing';
  desktopHeaderListingId?: string;
}

export default function PageShell({
  children,
  className,
  showBottomNav = true,
  desktopWide = false,
  showDesktopHeader = true,
  desktopHeaderVariant = 'default',
  desktopHeaderListingId,
}: PageShellProps) {
  const activePanel = useUIStore((s) => s.activePanel);

  return (
    <div className={cn('h-full overflow-hidden bg-white', className)}>
      <div className="flex h-full min-w-0">
        <DesktopSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {showDesktopHeader && <DesktopHeader variant={desktopHeaderVariant} listingId={desktopHeaderListingId} />}
          <div className={cn(
            'flex-1 overflow-hidden',
            desktopWide ? 'lg:mx-auto lg:w-full lg:max-w-[1872px]' : 'lg:mx-auto lg:w-full lg:max-w-2xl lg:border-x lg:border-[#F0F0F0]'
          )}>
            {children}
          </div>
        </div>
      </div>
      {showBottomNav && <BottomNav />}

      {/* Global panels (search, filter, saved searches) */}
      <AnimatePresence>
        {activePanel === 'search' && <SearchPanel key="search" />}
        {activePanel === 'filter' && <FilterPanel key="filter" />}
        {activePanel === 'saved-searches' && <SavedSearchesPanel key="saved-searches" />}
      </AnimatePresence>
    </div>
  );
}
