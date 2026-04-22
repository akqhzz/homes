'use client';
import { Search, Layers, SlidersHorizontal } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';

const NAV_LINKS = [
  { href: '/', label: 'Explore' },
  { href: '/saved', label: 'Saved' },
  { href: '/for-you', label: 'For You' },
  { href: '/menu', label: 'More' },
] as const;

export default function DesktopHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedLocations } = useSearchStore();
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const { setActivePanel } = useUIStore();

  const filterCount = activeFilterCount();
  const locationLabel =
    selectedLocations.length === 0
      ? 'Where?'
      : selectedLocations.length === 1
      ? selectedLocations[0].name
      : `${selectedLocations[0].name}, +${selectedLocations.length - 1}`;

  return (
    <>
      <header className="hidden lg:flex h-16 border-b border-[#F0F0F0] bg-white items-center px-6 gap-6 flex-shrink-0 z-30">
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-[#0F1729] flex items-center justify-center">
            <span className="text-white text-sm">🏠</span>
          </div>
          <span className="font-heading text-[#0F1729] text-lg">homes</span>
        </button>

        {/* Centered search */}
        <div className="flex-1 flex items-center justify-center gap-2 max-w-2xl mx-auto">
          <div className="flex-1 flex items-center gap-2.5 bg-[#F5F6F7] rounded-full px-4 py-2 transition-colors hover:bg-[#EBEBEB]">
            <button
              onClick={() => setActivePanel('search')}
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            >
              <Search size={15} className="text-[#9CA3AF] flex-shrink-0" />
              <span className={cn(
                'text-sm flex-1 truncate',
                selectedLocations.length === 0 ? 'text-[#9CA3AF]' : 'text-[#0F1729] font-medium'
              )}>
                {locationLabel}
              </span>
            </button>
            <button
              onClick={() => setActivePanel('area-select')}
              className="text-[#9CA3AF] hover:text-[#0F1729] transition-colors"
              aria-label="Set search area"
            >
              <Layers size={15} />
            </button>
          </div>

          <button
            onClick={() => setActivePanel('filter')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all',
              filterCount > 0
                ? 'bg-[#0F1729] text-white border-[#0F1729]'
                : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#0F1729] hover:text-[#0F1729]'
            )}
          >
            <SlidersHorizontal size={14} />
            Filters {filterCount > 0 && `(${filterCount})`}
          </button>

          <button
            onClick={() => setActivePanel('saved-searches')}
            className="px-4 py-2 rounded-full text-sm font-medium border border-[#E5E7EB] text-[#6B7280] hover:border-[#0F1729] hover:text-[#0F1729] transition-all"
          >
            Save Search
          </button>
        </div>

        {/* Right nav */}
        <nav className="flex items-center gap-1 flex-shrink-0">
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  active ? 'bg-[#F5F6F7] text-[#0F1729]' : 'text-[#6B7280] hover:text-[#0F1729]'
                )}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </header>

    </>
  );
}
