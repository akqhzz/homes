'use client';
import { Map, Heart, Sparkles, Menu, Bookmark, LayoutGrid } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import FloatingActionButton from '@/components/atoms/FloatingActionButton';

const NAV_ITEMS = [
  { href: '/', icon: Map, label: 'Map' },
  { href: '/saved', icon: Heart, label: 'Saved' },
  { href: '/for-you', icon: Sparkles, label: 'For You' },
  { href: '/menu', icon: Menu, label: 'Menu' },
] as const;

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { setActivePanel } = useUIStore();

  const isMapPage = pathname === '/';

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname === '/map' : pathname.startsWith(href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden flex items-center justify-center gap-2.5 px-4 pt-1 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
    >
      {/* Saved searches — map page only */}
      {isMapPage && (
        <FloatingActionButton
          layoutId="saved-undo-control"
          onClick={() => setActivePanel('saved-searches')}
          aria-label="Saved searches"
        >
          <Bookmark size={17} className="text-[#0F1729]" />
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
              className="w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-150 no-select hover:bg-[#F5F6F7]"
            >
              <Icon
                size={19}
                strokeWidth={active ? 2.3 : 1.7}
                className={active ? 'text-[#0F1729]' : 'text-[#C4C4C4]'}
              />
            </button>
          );
        })}
      </div>

      {/* Cards mode — map page only */}
      {isMapPage && (
        <FloatingActionButton
          layoutId="cards-map-control"
          onClick={() => setActivePanel('cards')}
          aria-label="Cards mode"
        >
          <LayoutGrid size={17} className="text-[#0F1729]" />
        </FloatingActionButton>
      )}
    </nav>
  );
}
