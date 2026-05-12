import type { Listing } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FEATURE_LABEL_COUNT = 6;
const FEATURE_LABEL_FREQUENCY = 4;

export default function ListingFeatureBadge({ listing, className }: { listing: Listing; className?: string }) {
  if (!shouldShowFeatureBadge(listing)) return null;

  const label = getListingFeatureLabel(listing);
  if (!label) return null;

  return (
    <span
      className={cn(
        'pointer-events-none absolute left-2.5 top-2.5 z-20 rounded-full bg-white/82 px-2.5 py-1.5 type-micro font-semibold text-[var(--color-text-primary)] shadow-[0_8px_20px_rgba(15,23,41,0.12)] backdrop-blur',
        className
      )}
    >
      {label}
    </span>
  );
}

function shouldShowFeatureBadge(listing: Listing) {
  return hashString(listing.id) % FEATURE_LABEL_FREQUENCY === 0;
}

function getListingFeatureLabel(listing: Listing) {
  switch (getLabelGroup(listing)) {
    case 0:
    case 1:
      return `⏳ Coming Soon ${formatMonthDay(buildComingSoonDate(listing.id))}`;
    case 2:
      return '🌟 eXp Special';
    case 3:
      return '🌊 Waterfront';
    case 4:
      return '🏡 Open House';
    case 5:
      return '🚶 Great Walk Score';
    default:
      return null;
  }
}

function getLabelGroup(listing: Listing) {
  return Math.floor(hashString(listing.id) / FEATURE_LABEL_FREQUENCY) % FEATURE_LABEL_COUNT;
}

function formatMonthDay(dateValue: string) {
  const [, month, day] = dateValue.split('-').map((part) => Number(part));
  if (!month || !day) return '';
  return `${MONTH_LABELS[month - 1] ?? ''} ${day}${getOrdinalSuffix(day)}`.trim();
}

function buildComingSoonDate(seed: string) {
  const hash = hashString(seed);
  const month = 4 + (hash % 3);
  const day = 3 + (hash % 23);
  return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getOrdinalSuffix(day: number) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
