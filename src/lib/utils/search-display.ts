import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { getMatchingNeighborhoodId } from '@/lib/search/utils';
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

function getUniqueChipLabels(labels: string[]) {
  const seen = new Set<string>();

  return labels.filter((label) => {
    const normalized = normalizeChipLabel(label);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
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

export function getAreaChipLabels({
  neighborhoodIds = [],
  searchAreaNames = [],
  fallbackLabel,
  includeFallbackWithNamedAreas = false,
}: {
  neighborhoodIds?: string[];
  searchAreaNames?: string[];
  fallbackLabel?: string;
  includeFallbackWithNamedAreas?: boolean;
}) {
  const neighborhoodLabels = neighborhoodIds
    .map((id) => MOCK_NEIGHBORHOODS.find((neighborhood) => neighborhood.id === id)?.name)
    .filter((label): label is string => Boolean(label))
    .map(getPrimaryLocationLabel);

  if (neighborhoodLabels.length > 0) {
    const labels = includeFallbackWithNamedAreas && fallbackLabel
      ? [...neighborhoodLabels, fallbackLabel]
      : neighborhoodLabels;
    return getUniqueChipLabels(labels);
  }

  const namedAreas = searchAreaNames.map(getPrimaryLocationLabel);
  if (namedAreas.length > 0) {
    const labels = includeFallbackWithNamedAreas && fallbackLabel
      ? [...namedAreas, fallbackLabel]
      : namedAreas;
    return getUniqueChipLabels(labels);
  }

  return fallbackLabel ? [fallbackLabel] : [];
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
  const chips = getAreaChips({
    neighborhoodIds,
    searchLocations: searchAreaNames.map((name, index) => ({
      id: `search-area-${index}`,
      name,
      boundary: [{ lat: 0, lng: 0 }, { lat: 0, lng: 0 }, { lat: 0, lng: 0 }],
    })),
    hasCustomBoundary,
  });

  return getCompactAreaChipLabel(chips);
}

export interface AreaChip {
  id: string;
  label: string;
  kind: 'neighborhood' | 'search-area' | 'custom-boundary';
}

export function getAreaChips({
  neighborhoodIds = [],
  searchLocations = [],
  hasCustomBoundary = false,
}: {
  neighborhoodIds?: string[];
  searchLocations?: Array<{ id: string; name: string; boundary?: Array<{ lat: number; lng: number }> }>;
  hasCustomBoundary?: boolean;
}) {
  const selectedNeighborhoodIdSet = new Set(neighborhoodIds);
  const neighborhoodChips = neighborhoodIds
    .map((id) => {
      const neighborhood = MOCK_NEIGHBORHOODS.find((item) => item.id === id);
      if (!neighborhood) return null;
      return {
        id: neighborhood.id,
        label: getPrimaryLocationLabel(neighborhood.name),
        kind: 'neighborhood' as const,
      };
    })
    .filter((chip): chip is { id: string; label: string; kind: 'neighborhood' } => Boolean(chip));
  const searchAreaChips = searchLocations
    .filter((location) => (location.boundary?.length ?? 0) >= 3)
    .filter((location) => {
      const matchingNeighborhoodId = getMatchingNeighborhoodId(location);
      return !matchingNeighborhoodId || !selectedNeighborhoodIdSet.has(matchingNeighborhoodId);
    })
    .map((location) => ({
      id: location.id,
      label: getPrimaryLocationLabel(location.name),
      kind: 'search-area' as const,
    }));

  const chips: AreaChip[] = [...neighborhoodChips, ...searchAreaChips];

  if (hasCustomBoundary) {
    chips.push({
      id: 'custom-boundary',
      label: 'Custom area',
      kind: 'custom-boundary',
    });
  }

  const seen = new Set<string>();
  return chips.filter((chip) => {
    const key = chip.kind === 'custom-boundary'
      ? `${chip.kind}:${chip.id}`
      : normalizeChipLabel(chip.label);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getCompactAreaChipLabel(chips: AreaChip[]) {
  if (chips.length === 0) return undefined;
  if (chips.length === 1) return chips[0].label;
  return `${chips[0].label} +${chips.length - 1}`;
}

export function getListingsAreaTitleLabel(compactAreaChipLabel?: string, fallbackLabel = 'Selected Area') {
  if (!compactAreaChipLabel) return fallbackLabel;

  const compactMatch = compactAreaChipLabel.match(/^(.*)\s\+(\d+)$/);
  if (!compactMatch) return compactAreaChipLabel;

  const [, primaryLabel, extraCount] = compactMatch;
  return `${primaryLabel} +${extraCount} More`;
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
