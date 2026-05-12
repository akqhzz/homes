import type { Listing } from '@/lib/types';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FEATURE_LABEL_COUNT = 6;
const FEATURE_LABEL_FREQUENCY = 4;

export type ListingFeatureLabelKind = 'coming-soon' | 'exp-special' | 'waterfront' | 'open-house' | 'walk-score';

export function getListingFeatureLabel(listing: Listing) {
  if (!shouldShowFeatureLabel(listing)) return null;

  switch (getListingFeatureLabelGroup(listing)) {
    case 0:
    case 1:
      return {
        kind: 'coming-soon' as const,
        label: `⏳ Coming Soon ${formatMonthDay(buildComingSoonDate(listing.id))}`,
      };
    case 2:
      return { kind: 'exp-special' as const, label: '🌟 eXp Special' };
    case 3:
      return { kind: 'waterfront' as const, label: '🌊 Waterfront' };
    case 4:
      return { kind: 'open-house' as const, label: '🏡 Open House' };
    case 5:
      return { kind: 'walk-score' as const, label: '🚶 Great Walk Score' };
    default:
      return null;
  }
}

export function hasComingSoonFeatureLabel(listing: Listing) {
  return getListingFeatureLabel(listing)?.kind === 'coming-soon';
}

function shouldShowFeatureLabel(listing: Listing) {
  return hashString(listing.id) % FEATURE_LABEL_FREQUENCY === 0;
}

function getListingFeatureLabelGroup(listing: Listing) {
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
