'use client';
import type { RefObject } from 'react';
import { Search } from 'lucide-react';
import type { Location } from '@/lib/types';
import type { AreaChip } from '@/lib/utils/search-display';
import { cn } from '@/lib/utils/cn';
import Button from '@/components/ui/Button';
import SearchLocationChip from '@/features/search/components/SearchLocationChip';
import SearchLocationResultItem from '@/features/search/components/SearchLocationResultItem';

interface DesktopSearchControlProps {
  containerRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  showSearch: boolean;
  searchQuery: string;
  selectedLocations: Location[];
  visibleAreaChips: AreaChip[];
  locationLabel: string;
  hasAppliedArea: boolean;
  compactAreaChipLabel?: string;
  filteredLocations: Location[];
  isSearchLoading: boolean;
  onOpenSearch: () => void;
  onSearchQueryChange: (value: string) => void;
  onSelectLocation: (location: Location) => void;
  onRemoveLocation: (location: Location) => void;
  onRemoveAreaChip: (chip: AreaChip) => void;
  onClearAll: () => void;
}

export default function DesktopSearchControl({
  containerRef,
  inputRef,
  showSearch,
  searchQuery,
  selectedLocations,
  visibleAreaChips,
  locationLabel,
  hasAppliedArea,
  compactAreaChipLabel,
  filteredLocations,
  isSearchLoading,
  onOpenSearch,
  onSearchQueryChange,
  onSelectLocation,
  onRemoveLocation,
  onRemoveAreaChip,
  onClearAll,
}: DesktopSearchControlProps) {
  return (
    <div ref={containerRef} className="relative w-[316px] flex-none">
      <div
        onClick={onOpenSearch}
        className={cn(
          'flex min-h-[44px] w-full min-w-0 cursor-text items-center gap-2.5 rounded-full bg-white px-3.5 text-left shadow-[var(--shadow-control)] transition-all hover:bg-[var(--color-surface)]',
          showSearch && 'border border-[var(--color-text-primary)]'
        )}
      >
        <Search size={15} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
        {showSearch ? (
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && filteredLocations[0]) onSelectLocation(filteredLocations[0]);
            }}
            placeholder={selectedLocations.length > 0 ? 'Add another area...' : 'Add an area'}
            className="type-label min-w-0 flex-1 bg-transparent text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
          />
        ) : hasAppliedArea && compactAreaChipLabel ? (
          <span className="type-label inline-flex max-w-full items-center truncate rounded-full bg-[var(--color-brand-surface)] px-2.5 py-0.5 text-[var(--color-brand-text)]">
            {compactAreaChipLabel}
          </span>
        ) : selectedLocations.length > 0 ? (
          <span className="type-label inline-flex max-w-full items-center truncate rounded-full bg-[var(--color-brand-surface)] px-2.5 py-0.5 text-[var(--color-brand-text)]">
            {locationLabel}
          </span>
        ) : (
          <span className="type-label flex-1 truncate text-[var(--color-text-tertiary)]">{locationLabel}</span>
        )}
      </div>
      {showSearch && (
        <div className="absolute left-0 right-0 top-[54px] z-[80] rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
          {(selectedLocations.length > 0 || visibleAreaChips.length > 0) && (
            <div className="flex items-center gap-2 border-b border-[var(--color-surface)] px-2 py-2">
              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
                {selectedLocations.map((location) => (
                  <SearchLocationChip
                    key={location.id}
                    location={location}
                    onRemove={() => onRemoveLocation(location)}
                    className="type-caption py-1"
                  />
                ))}
                {visibleAreaChips.map((chip) => (
                  <SearchLocationChip
                    key={chip.id}
                    label={chip.label}
                    onRemove={() => onRemoveAreaChip(chip)}
                    className="type-caption py-1"
                  />
                ))}
              </div>
              <Button
                variant="surface"
                size="xs"
                onClick={onClearAll}
                className="type-caption shrink-0 font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                Clear
              </Button>
            </div>
          )}
          <div className="py-1">
            {filteredLocations.map((location, index) => (
              <SearchLocationResultItem
                key={location.id}
                location={location}
                onSelect={() => onSelectLocation(location)}
                highlighted={index === 0 && Boolean(searchQuery.trim())}
              />
            ))}
            {isSearchLoading && (
              <div className="px-3 py-3 type-caption text-[var(--color-text-tertiary)]">Searching locations…</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
