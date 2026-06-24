import type { Listing } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { getListingFeatureLabel } from '@/lib/listing-feature-labels';

export default function ListingFeatureBadge({ listing, className }: { listing: Listing; className?: string }) {
  // Sold listings show the Sold badge in this spot instead — never a feature
  // label like "Coming Soon".
  if (listing.listingStatus === 'sold') return null;
  const featureLabel = getListingFeatureLabel(listing);
  if (!featureLabel) return null;

  return (
    <span
      className={cn(
        'pointer-events-none absolute left-2.5 top-2.5 z-20 rounded-full bg-white/82 px-2.5 py-1.5 type-micro font-semibold text-[var(--color-text-primary)] shadow-[0_8px_20px_rgba(15,23,41,0.12)] backdrop-blur',
        className
      )}
    >
      {featureLabel.label}
    </span>
  );
}
