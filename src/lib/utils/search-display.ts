import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { SavedSearch, SearchFilters } from '@/lib/types';
import { formatPrice, formatPropertyType } from '@/lib/utils/format';
import { getPrimaryLocationLabel } from '@/lib/utils/location-label';

const SEARCH_SUMMARY_PLACEHOLDER = 'No locations or filters selected';

function getCompactSummaryLabel(labels: string[]) {
  if (labels.length === 0) return undefined;
  if (labels.length === 1) return labels[0];
  return `${labels[0]} + ${labels.length - 1} more`;
}

function normalizeChipLabel(label: string) {
  return label.trim().toLowerCase();
}

export function formatCompactPriceValue(value: number) {
  return formatPrice(value).replace('K', 'k');
}

export function parseCompactPriceValue(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '').replace(/\$/g, '').replace(/,/g, '');
  if (!normalized) return undefined;

  const multiplier = normalized.endsWith('m') ? 1_000_000 : normalized.endsWith('k') ? 1_000 : 1;
  const numericPortion = multiplier === 1 ? normalized : normalized.slice(0, -1);
  const parsed = Number(numericPortion);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;

  return Math.round(parsed * multiplier);
}

export function formatPriceRangeLabel(minPrice?: number, maxPrice?: number) {
  if (!minPrice && !maxPrice) return undefined;
  if (minPrice && maxPrice) return `${formatCompactPriceValue(minPrice)}-${formatCompactPriceValue(maxPrice)}`;
  if (minPrice) return `Min ${formatCompactPriceValue(minPrice)}`;
  return `Max ${formatCompactPriceValue(maxPrice ?? 0)}`;
}

export function getLocationSummaryLabel(locationNames: string[]) {
  return getCompactSummaryLabel(locationNames.map(getPrimaryLocationLabel));
}

export function getAreaSummaryLabel({
  neighborhoodIds = [],
  searchAreaNames = [],
  hasCustomBoundary = false,
}: {
  neighborhoodIds?: string[];
  searchAreaNames?: string[];
  hasCustomBoundary?: boolean;
}) {
  const neighborhoodLabels = neighborhoodIds
    .map((id) => MOCK_NEIGHBORHOODS.find((neighborhood) => neighborhood.id === id)?.name)
    .filter((label): label is string => Boolean(label))
    .map(getPrimaryLocationLabel);

  const namedAreas = neighborhoodLabels.length > 0
    ? neighborhoodLabels
    : searchAreaNames.map(getPrimaryLocationLabel);

  if (namedAreas.length > 0) return getCompactSummaryLabel(namedAreas);
  if (hasCustomBoundary) return 'Custom area';
  return undefined;
}

export function getSearchFilterLabels(filters: SearchFilters) {
  const labels: string[] = [];
  const priceLabel = formatPriceRangeLabel(filters.minPrice, filters.maxPrice);

  if (priceLabel) labels.push(priceLabel);
  if (filters.propertyTypes.length > 0) {
    labels.push(filters.propertyTypes.map((type) => formatPropertyType(type)).join(', '));
  }
  if (filters.minBeds) labels.push(`${filters.minBeds}+ bd`);
  if (filters.minBaths) labels.push(`${filters.minBaths}+ ba`);
  if (filters.maxDaysOnMarket) {
    labels.push(filters.maxDaysOnMarket === 1 ? '1 day' : `${filters.maxDaysOnMarket} days`);
  }
  if (filters.minSqft || filters.maxSqft) {
    if (filters.minSqft && filters.maxSqft) labels.push(`${filters.minSqft}-${filters.maxSqft} sqft`);
    else if (filters.minSqft) labels.push(`Min ${filters.minSqft} sqft`);
    else labels.push(`Max ${filters.maxSqft} sqft`);
  }

  return labels;
}

export function getSavedSearchCriteriaSummary(search: SavedSearch) {
  const locationLabels = search.locations.map((location) => location.name);
  const areaLabel = getAreaSummaryLabel({
    neighborhoodIds: search.neighborhoodIds,
    searchAreaNames: search.locations
      .filter((location) => (location.boundary?.length ?? 0) >= 3)
      .map((location) => location.name),
    hasCustomBoundary: (search.areaBoundary?.length ?? 0) >= 3,
  });
  const locationSummary = getLocationSummaryLabel(locationLabels);
  const scopeSummary = locationSummary ?? areaLabel;
  const filterSummary = getSearchFilterLabels(search.filters);

  if (!scopeSummary && filterSummary.length === 0) return SEARCH_SUMMARY_PLACEHOLDER;
  return [scopeSummary, ...filterSummary].filter(Boolean).join(' · ');
}

export function getSearchSummaryPlaceholder() {
  return SEARCH_SUMMARY_PLACEHOLDER;
}

export function shouldShowAreaSummaryChip(locationNames: string[], areaSummaryLabel?: string) {
  if (!areaSummaryLabel) return false;

  const normalizedAreaLabel = normalizeChipLabel(areaSummaryLabel);
  return !locationNames
    .map(getPrimaryLocationLabel)
    .some((locationLabel) => normalizeChipLabel(locationLabel) === normalizedAreaLabel);
}
