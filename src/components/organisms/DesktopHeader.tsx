'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Bell,
  Bookmark,
  ChevronRight,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Share2,
  Shield,
  SlidersHorizontal,
  User,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSearchStore } from '@/store/searchStore';
import { useUIStore } from '@/store/uiStore';
import { useSavedStore } from '@/store/savedStore';
import { useSavedSearchStore } from '@/store/savedSearchStore';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { cn } from '@/lib/utils/cn';
import { Location } from '@/lib/types';
import ListingSaveButton from '@/components/molecules/ListingSaveButton';
import CreateInlineField from '@/components/molecules/CreateInlineField';
import AppImageIcon from '@/components/atoms/AppImageIcon';
import SearchLocationResultItem from '@/components/molecules/SearchLocationResultItem';
import { FilterPanelBody, FilterPanelFooter } from '@/components/organisms/FilterPanel';
import { getPrimaryLocationLabel } from '@/lib/utils/location-label';
import BackButton from '@/components/atoms/BackButton';

const MENU_ITEMS = [
  { icon: User, label: 'Profile' },
  { icon: Bell, label: 'Notification Preference' },
  { icon: Shield, label: 'Privacy & Security' },
  { icon: MessageSquare, label: 'Send Feedback' },
];

interface DesktopHeaderProps {
  variant?: 'default' | 'listing';
  listingId?: string;
}

export default function DesktopHeader({ variant = 'default', listingId }: DesktopHeaderProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const collectionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { selectedLocations, addLocation, removeLocation, clearLocations } = useSearchStore();
  const { results: filteredLocations, isLoading: isSearchLoading } = useLocationSearch(
    searchQuery,
    selectedLocations,
    showSearch
  );
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const { searches, activeSearchId, activeSearchDirty } = useSavedSearchStore();
  const { activePanel, setActivePanel } = useUIStore();
  const { collections, createCollection } = useSavedStore();

  const isCollectionsPage = pathname.startsWith('/saved');
  const isListingVariant = variant === 'listing';
  const isMapPage = pathname === '/' || pathname === '/map';
  const filterCount = activeFilterCount();
  const activeSearch = searches.find((search) => search.id === activeSearchId);
  const locationLabel =
    selectedLocations.length === 0
      ? 'Where?'
      : selectedLocations.length === 1
      ? getPrimaryLocationLabel(selectedLocations[0].name)
      : `${getPrimaryLocationLabel(selectedLocations[0].name)}, +${selectedLocations.length - 1}`;

  const selectLocation = (location: Location) => {
    addLocation(location);
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleCreateCollection = () => {
    const name = newCollectionName.trim();
    if (!name) return;
    createCollection(name);
    setNewCollectionName('');
    setCreatingCollection(false);
  };

  useEffect(() => {
    if (!showFilter && !showSearch && !showMenu && !showCollections) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!filterRef.current?.contains(target)) setShowFilter(false);
      if (!searchRef.current?.contains(target)) setShowSearch(false);
      if (!menuRef.current?.contains(target)) setShowMenu(false);
      if (!collectionsRef.current?.contains(target)) setShowCollections(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showFilter, showSearch, showMenu, showCollections]);

  useEffect(() => {
    if (!showSearch) return;
    const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [showSearch]);

  return (
    <>
      <header className="relative hidden lg:flex min-h-[76px] bg-white items-center px-6 py-3 flex-shrink-0 z-30">
        {isListingVariant ? (
          <BackButton />
        ) : !isMapPage ? (
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <span className="type-heading text-[#0F1729]">homes</span>
          </button>
        ) : null}

        {/* Centered search */}
        <div className={cn(
          'items-center justify-center gap-2 max-w-[540px]',
          isCollectionsPage
            ? 'hidden'
            : isListingVariant
            ? 'absolute left-1/2 top-1/2 flex w-[540px] -translate-x-1/2 -translate-y-1/2'
            : isMapPage
            ? 'absolute left-1/2 top-1/2 flex w-[540px] -translate-x-1/2 -translate-y-1/2'
            : 'mx-auto flex flex-1'
        )}>
          <div ref={searchRef} className="relative w-[316px] flex-none">
            <div
              onClick={() => {
                setShowSearch(true);
                setShowFilter(false);
                setShowMenu(false);
              }}
              className={cn(
                'flex min-h-[44px] w-full min-w-0 cursor-text items-center gap-2.5 rounded-full bg-white px-3.5 text-left shadow-[var(--shadow-control)] transition-all hover:bg-[#F9FAFB]',
                showSearch && 'shadow-[inset_0_0_0_1.5px_#0F1729,0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]'
              )}
            >
              <Search size={15} className="text-[#9CA3AF] flex-shrink-0" />
              {showSearch ? (
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && filteredLocations[0]) selectLocation(filteredLocations[0]);
                  }}
                  placeholder={selectedLocations.length > 0 ? 'Add another area...' : 'Where?'}
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#0F1729] outline-none placeholder:text-[#9CA3AF]"
                />
              ) : selectedLocations.length > 0 ? (
                <span className="inline-flex max-w-full items-center truncate rounded-full bg-[var(--color-brand-surface)] px-2.5 py-0.5 text-sm font-medium text-[var(--color-brand-text)]">
                  {locationLabel}
                </span>
              ) : (
                <span className="flex-1 truncate text-sm font-medium text-[#9CA3AF]">{locationLabel}</span>
              )}
            </div>
            {showSearch && (
              <div className="absolute left-0 right-0 top-[54px] z-40 rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
                {selectedLocations.length > 0 && (
                  <div className="flex items-center gap-2 border-b border-[#F5F6F7] px-2 py-2">
                    <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-hide">
                      {selectedLocations.map((location) => (
                        <span key={location.id} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-brand-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-brand-text)]">
                          {location.name}
                          <button onClick={() => removeLocation(location.id)} className="text-[var(--color-brand-text)] hover:text-[var(--color-brand-text)]">×</button>
                        </span>
                      ))}
                    </div>
                    <button onClick={clearLocations} className="shrink-0 rounded-full bg-[#F5F6F7] px-3 py-1 text-xs font-semibold text-[#6B7280] hover:text-[#0F1729]">
                      Clear
                    </button>
                  </div>
                )}
                <div className="py-1">
                  {filteredLocations.map((location, index) => (
                    <SearchLocationResultItem
                      key={location.id}
                      location={location}
                      onSelect={() => selectLocation(location)}
                      highlighted={index === 0 && Boolean(searchQuery.trim())}
                    />
                  ))}
                  {isSearchLoading && (
                    <div className="px-3 py-3 type-caption text-[#9CA3AF]">Searching locations…</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div ref={filterRef} className="relative">
            <button
              onClick={() => {
                setShowFilter((value) => !value);
                setShowSearch(false);
                setShowMenu(false);
              }}
              className={cn(
                'relative flex h-11 items-center gap-2 rounded-full bg-white px-4 type-btn text-[#0F1729] shadow-[var(--shadow-control)] transition-colors hover:bg-[#F5F6F7] no-select',
                filterCount > 0 && 'shadow-[inset_0_0_0_1.5px_#374151,0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]'
              )}
              aria-label="Filters"
            >
              <SlidersHorizontal size={16} className="text-[#0F1729]" />
              Filter
              {filterCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#374151] px-1 type-nano leading-none text-white">
                  {filterCount}
                </span>
              )}
            </button>
            {showFilter && (
              <div className="absolute right-0 top-[58px] z-40 flex max-h-[min(640px,calc(100vh-12rem))] w-[390px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
                <div className="flex-1 overflow-y-auto">
                  <FilterPanelBody />
                </div>
                <div className="sticky bottom-0 border-t border-[#F5F6F7] bg-white p-4">
                  <FilterPanelFooter onDone={() => setShowFilter(false)} />
                </div>
              </div>
            )}
          </div>

          <button
            data-saved-search-trigger="true"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              setShowFilter(false);
              setShowSearch(false);
              setShowMenu(false);
              setShowCollections(false);
              setActivePanel(activePanel === 'saved-searches' ? 'none' : 'saved-searches');
            }}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-[var(--shadow-control)] transition-colors hover:bg-[#F5F6F7]"
            aria-label="Saved searches"
          >
            {activeSearch?.thumbnail ? (
              <span className="relative block h-5 w-5 overflow-hidden rounded-[6px]">
                <Image src={activeSearch.thumbnail} alt="" fill sizes="20px" className="object-cover" />
              </span>
            ) : (
              <Bookmark size={18} className="text-[#0F1729]" />
            )}
            {activeSearchDirty && (
              <span className="absolute right-[11px] top-[11px] h-1.5 w-1.5 rounded-full bg-[#0F1729] ring-1 ring-white" />
            )}
          </button>
        </div>

        {/* Right nav */}
        <nav className={cn('flex items-center gap-1 flex-shrink-0', (isCollectionsPage || isListingVariant || isMapPage) && 'ml-auto')}>
          {isListingVariant ? (
            <>
              {listingId && <ListingSaveButton listingId={listingId} className="bg-[#0F1729] text-white hover:bg-[#1F2937]" />}
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-full bg-[#F5F6F7] px-4 text-sm font-semibold text-[#0F1729] transition-colors hover:bg-[#EBEBEB]"
              >
                <Share2 size={15} />
                Share
              </button>
            </>
          ) : isCollectionsPage ? (
            <button
              onClick={() => router.push('/')}
              className="h-10 rounded-full bg-[#0F1729] px-4 text-sm font-semibold text-white transition-all hover:bg-[#1F2937]"
            >
              Map
            </button>
          ) : (
            <div ref={collectionsRef} className="relative">
              <button
                onClick={() => {
                  setShowCollections((value) => !value);
                  setShowFilter(false);
                  setShowSearch(false);
                  setShowMenu(false);
                }}
                className="h-11 rounded-full bg-[#F5F6F7] px-4 type-btn text-[#0F1729] transition-all hover:bg-[#EBEBEB]"
              >
                <span className="inline-flex items-center gap-2">
                  <AppImageIcon src="/icons/collection.png" alt="Collections" size={18} className="rounded-[5px]" />
                  Collections
                </span>
              </button>
              {showCollections && (
                <div className="absolute right-0 top-12 z-40 w-80 rounded-3xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
                  <CreateInlineField
                    open={creatingCollection}
                    onOpenChange={setCreatingCollection}
                    value={newCollectionName}
                    onValueChange={setNewCollectionName}
                    placeholder="Collection Name..."
                    collapsedLabel="New Collection"
                    onSubmit={handleCreateCollection}
                    autoFocus
                    submitStyle="icon"
                    submitIcon={<Plus size={16} />}
                    className="mb-3"
                    collapsedClassName="mb-3 rounded-2xl font-medium"
                  />
                  <div className="flex flex-col gap-2.5">
                    {collections.slice(0, 4).map((collection) => {
                      const listing = MOCK_LISTINGS.find((item) => item.id === collection.listings[0]?.listingId);
                      return (
                        <button
                          key={collection.id}
                          onClick={() => router.push(`/saved/${collection.id}`)}
                          className="flex min-h-[84px] items-center gap-3 rounded-2xl bg-[#F5F6F7] px-4 py-3 text-left transition-colors hover:bg-[#EBEBEB]"
                        >
                          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                            {listing?.images[0] && (
                              <Image src={listing.images[0]} alt="" fill sizes="56px" className="object-cover" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-heading text-sm text-[#0F1729]">{collection.name}</span>
                            <span className="block type-caption text-[#9CA3AF]">{collection.listings.length} Listing{collection.listings.length === 1 ? '' : 's'}</span>
                          </span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => router.push('/saved')}
                      className="flex min-h-[84px] items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-left transition-colors hover:border-[#D1D5DB] hover:bg-[#F9FAFB]"
                    >
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                        {MOCK_LISTINGS[0]?.images[0] && (
                          <Image src={MOCK_LISTINGS[0].images[0]} alt="" fill sizes="56px" className="object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-heading text-sm text-[#0F1729]">All Collections</span>
                        <span className="block type-caption text-[#9CA3AF]">View Your Saved Homes</span>
                      </span>
                      <ChevronRight size={15} className="shrink-0 text-[#9CA3AF]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {!isListingVariant && !isMapPage && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => {
                  setShowMenu((value) => !value);
                  setShowFilter(false);
                  setShowSearch(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-[#F5F6F7] hover:text-[#0F1729]"
                aria-label="Menu"
              >
                <Menu size={19} />
              </button>
              {showMenu && (
                <DesktopMenu />
              )}
            </div>
          )}
        </nav>
      </header>

    </>
  );
}

function DesktopMenu() {
  return (
    <div className="absolute right-0 top-12 z-40 w-72 overflow-hidden rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
      {MENU_ITEMS.map((item) => (
        <button key={item.label} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#F5F6F7]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F5F6F7]">
            <item.icon size={15} className="text-[#0F1729]" />
          </div>
          <span className="flex-1 type-body font-medium text-[#0F1729]">{item.label}</span>
        </button>
      ))}
      <button className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-red-50">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50">
          <LogOut size={15} className="text-[#EF4444]" />
        </div>
        <span className="flex-1 type-body font-medium text-[#EF4444]">Sign Out</span>
      </button>
    </div>
  );
}
