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
}

export default function PageShell({ children, className }: PageShellProps) {
  const activePanel = useUIStore((s) => s.activePanel);

  return (
    <div className={cn('h-full flex flex-col overflow-hidden bg-white', className)}>
      <DesktopHeader />
      <div className="flex-1 overflow-hidden lg:max-w-2xl lg:mx-auto lg:w-full lg:border-x lg:border-[#F0F0F0]">
        {children}
      </div>
      <BottomNav />

      {/* Global panels (search, filter, saved searches) */}
      <AnimatePresence>
        {activePanel === 'search' && <SearchPanel key="search" />}
        {activePanel === 'filter' && <FilterPanel key="filter" />}
        {activePanel === 'saved-searches' && <SavedSearchesPanel key="saved-searches" />}
      </AnimatePresence>
    </div>
  );
}
