'use client';
import Image from 'next/image';
import { Bookmark, GalleryHorizontalEnd, Map, Heart, Sparkles, Menu, Plus } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import FloatingActionButton from '@/components/atoms/FloatingActionButton';

const NAV_ITEMS = [
  { href: '/', icon: Map, label: 'Map' },
  { href: '/saved', icon: Heart, label: 'Saved' },
  { href: '/for-you', icon: Sparkles, label: 'For You' },
  { href: '/menu', icon: Menu, label: 'Menu' },
] as const;
const NAV_BUTTON_CLASS =
  'flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-150 no-select hover:bg-[var(--color-surface)]';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { setActivePanel } = useUIStore();
  const { searches, activeSearchId, activeSearchDirty } = useSavedSearchStore();

  const isMapPage = pathname === '/';
  const isSavedPage = pathname === '/saved';
  const activeSearch = searches.find((search) => search.id === activeSearchId);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname === '/map' : pathname.startsWith(href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden flex items-center justify-center gap-2.5 px-4 pt-1 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      {isMapPage && (
        <FloatingActionButton
          layoutId="cards-map-control"
          onClick={() => setActivePanel('cards')}
          aria-label="Cards mode"
        >
          <GalleryHorizontalEnd size={18} className="text-[var(--color-text-primary)]" />
        </FloatingActionButton>
      )}

      {/* Pill nav */}
      <div className="pointer-events-auto flex items-center bg-white rounded-full px-1.5 py-1.5 gap-0 shadow-[0_4px_18px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.05)]">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              aria-label={label}
              className={NAV_BUTTON_CLASS}
            >
              <Icon
                size={19}
                strokeWidth={active ? 2.3 : 1.7}
                className={active ? 'text-[var(--color-text-primary)]' : 'text-[#C4C4C4]'}
              />
            </button>
          );
        })}
      </div>

      {isSavedPage && (
        <FloatingActionButton
          layoutId="saved-add-control"
          onClick={() => window.dispatchEvent(new CustomEvent('homes:create-collection'))}
          aria-label="Add collection"
        >
          <Plus size={17} className="text-[var(--color-text-primary)]" />
        </FloatingActionButton>
      )}

      {isMapPage && (
        <FloatingActionButton
          layoutId="saved-undo-control"
          onClick={() => setActivePanel('saved-searches')}
          aria-label="Saved searches"
          className="relative"
        >
          {activeSearch?.thumbnail ? (
            <span className="relative block h-[19px] w-[19px] overflow-hidden rounded-[6px]">
              <Image src={activeSearch.thumbnail} alt="" fill sizes="19px" className="object-cover object-center" />
            </span>
          ) : (
            <Bookmark size={18} className="text-[var(--color-text-primary)]" />
          )}
          {activeSearchDirty && (
            <span className="absolute right-[11px] top-[11px] h-1.5 w-1.5 rounded-full bg-[var(--color-text-primary)] ring-1 ring-white" />
          )}
        </FloatingActionButton>
      )}
    </nav>
  );
}
