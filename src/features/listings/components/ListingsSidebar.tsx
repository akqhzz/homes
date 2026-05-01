'use client';
import { Listing } from '@/lib/types';
import ListingsListView from '@/features/listings/components/ListingsListView';

interface ListingsSidebarProps {
  listings: Listing[];
  useMapAreaLabel?: boolean;
  areaTitleLabel?: string;
  onDesktopViewChange?: (view: 'grid' | 'rows') => void;
  scrollRestorationKey?: string;
  desktopMapExpanded?: boolean;
}

export default function ListingsSidebar({
  listings,
  useMapAreaLabel = false,
  areaTitleLabel,
  onDesktopViewChange,
  scrollRestorationKey,
  desktopMapExpanded,
}: ListingsSidebarProps) {
  return (
    <ListingsListView
      listings={listings}
      useMapAreaLabel={useMapAreaLabel}
      areaTitleLabel={areaTitleLabel}
      variant="desktop"
      onDesktopViewChange={onDesktopViewChange}
      scrollRestorationKey={scrollRestorationKey}
      desktopMapExpanded={desktopMapExpanded}
    />
  );
}
