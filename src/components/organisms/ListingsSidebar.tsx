'use client';
import { Listing } from '@/lib/types';
import ListingsListView from '@/components/organisms/ListingsListView';

interface ListingsSidebarProps {
  listings: Listing[];
  useMapAreaLabel?: boolean;
  areaTitleLabel?: string;
}

export default function ListingsSidebar({ listings, useMapAreaLabel = false, areaTitleLabel }: ListingsSidebarProps) {
  return (
    <ListingsListView
      listings={listings}
      useMapAreaLabel={useMapAreaLabel}
      areaTitleLabel={areaTitleLabel}
      variant="desktop"
    />
  );
}
