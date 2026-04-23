'use client';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import DesktopHeader from '@/components/organisms/DesktopHeader';
import BottomNav from '@/components/organisms/BottomNav';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';

const SearchPanel = dynamic(() => import('@/components/organisms/SearchPanel'), { ssr: false });
const FilterPanel = dynamic(() => import('@/components/organisms/FilterPanel'), { ssr: false });
const SavedSearchesPanel = dynamic(() => import('@/components/organisms/SavedSearchesPanel'), { ssr: false });

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
    <div className={cn('h-full flex flex-col overflow-hidden bg-white', className)}>
      {showDesktopHeader && <DesktopHeader variant={desktopHeaderVariant} listingId={desktopHeaderListingId} />}
      <div className={cn(
        'flex-1 overflow-hidden',
        desktopWide ? 'lg:w-full' : 'lg:max-w-2xl lg:mx-auto lg:w-full lg:border-x lg:border-[#F0F0F0]'
      )}>
        {children}
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
