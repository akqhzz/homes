import type { Feature, FeatureCollection, LineString, Point, Polygon } from 'geojson';
import type { GeoJSONFeature } from 'mapbox-gl';
import type { LayerProps, MapRef } from 'react-map-gl/mapbox';
import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { closePolygon, getNeighborhoodBounds, getPolygonCentroid } from '@/lib/geo';
import { formatPrice } from '@/lib/utils/format';
import type { Listing, Location, Neighborhood } from '@/lib/types';

export const LISTING_MARKER_OFFSETS = [
  { lat: 0.0000, lng: 0.0000 },
  { lat: 0.0017, lng: -0.0019 },
  { lat: -0.0018, lng: 0.0018 },
  { lat: 0.0025, lng: 0.0014 },
  { lat: -0.0023, lng: -0.0015 },
  { lat: 0.0010, lng: 0.0030 },
  { lat: -0.0010, lng: -0.0030 },
  { lat: 0.0030, lng: -0.0004 },
  { lat: -0.0030, lng: 0.0004 },
  { lat: 0.0002, lng: 0.0024 },
];

export const CLUSTER_SOURCE_ID = 'listing-clusters-source';
export const CLUSTER_LAYER_ID = 'listing-clusters';
export const CLUSTER_COUNT_LAYER_ID = 'listing-cluster-count';
export const UNCLUSTERED_CIRCLE_LAYER_ID = 'listing-unclustered-circle';
export const UNCLUSTERED_LABEL_LAYER_ID = 'listing-unclustered-label';
export const CLUSTER_TRANSITION_ZOOM = 13.8;

export const LISTING_CLUSTER_LAYER = {
  id: CLUSTER_LAYER_ID,
  type: 'circle' as const,
  filter: ['has', 'point_count'] as const,
  paint: {
    'circle-color': '#2A654F',
    'circle-radius': ['step', ['get', 'point_count'], 18, 8, 21, 20, 24] as const,
    'circle-stroke-color': 'rgba(255,255,255,0)',
    'circle-stroke-width': 0,
    'circle-opacity': 0,
  },
} satisfies LayerProps;

export const LISTING_CLUSTER_COUNT_LAYER = {
  id: CLUSTER_COUNT_LAYER_ID,
  type: 'symbol' as const,
  filter: ['has', 'point_count'] as const,
  layout: {
    'text-field': ['get', 'point_count_abbreviated'] as const,
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'] as const,
    'text-size': 11,
    'text-allow-overlap': true,
  },
  paint: {
    'text-color': 'rgba(255, 255, 255, 0)',
  },
} satisfies LayerProps;

export const LISTING_UNCLUSTERED_CIRCLE_LAYER = {
  id: UNCLUSTERED_CIRCLE_LAYER_ID,
  type: 'circle' as const,
  filter: ['!', ['has', 'point_count']] as const,
  paint: {
    'circle-color': '#245A46',
    'circle-radius': 18,
    'circle-stroke-color': 'rgba(255,255,255,0)',
    'circle-stroke-width': 0,
    'circle-opacity': 0,
  },
} satisfies LayerProps;

export const LISTING_UNCLUSTERED_LABEL_LAYER = {
  id: UNCLUSTERED_LABEL_LAYER_ID,
  type: 'symbol' as const,
  filter: ['!', ['has', 'point_count']] as const,
  layout: {
    'text-field': ['get', 'priceLabel'] as const,
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'] as const,
    'text-size': 9,
    'text-allow-overlap': true,
  },
  paint: {
    'text-color': 'rgba(255, 255, 255, 0)',
  },
} satisfies LayerProps;

export const AMENITY_POINTS = [
  { id: 'amenity-transit-1', label: 'Transit', lat: 43.657, lng: -79.391 },
  { id: 'amenity-park-1', label: 'Park', lat: 43.663, lng: -79.404 },
  { id: 'amenity-school-1', label: 'School', lat: 43.651, lng: -79.382 },
  { id: 'amenity-grocery-1', label: 'Grocery', lat: 43.646, lng: -79.398 },
  { id: 'amenity-cafe-1', label: 'Cafe', lat: 43.668, lng: -79.374 },
];

export type NeighborhoodDisplayItem =
  | { id: string; type: 'cluster'; anchor: { lat: number; lng: number }; neighborhoods: Neighborhood[] }
  | { id: string; type: 'pin'; anchor: { lat: number; lng: number }; neighborhoods: [Neighborhood] };

export type ClusterRenderItem =
  | {
      id: string;
      type: 'cluster';
      clusterId: number;
      count: number;
      coordinates: { lat: number; lng: number };
    }
  | {
      id: string;
      type: 'listing';
      listingId: string;
      coordinates: { lat: number; lng: number };
    };

export type ListingMarkerEntry = {
  listing: Listing;
  markerCoordinates: { lat: number; lng: number };
};

type ClusteredListingProperties = {
  listingId: string;
  price: number;
  priceLabel: string;
};

export function getDrawnBoundaryFeature(points: { lat: number; lng: number }[]): Feature<LineString | Polygon> {
  const coordinates = points.map((point) => [point.lng, point.lat]);
  if (points.length > 2) {
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[...coordinates, coordinates[0]]],
      },
    };
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };
}

export function getNeighborhoodBoundaryFeature(neighborhood: Neighborhood) {
  const boundary = closePolygon(neighborhood.boundary ?? []);

  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [boundary.map((point) => [point.lng, point.lat])],
    },
  };
}

export function getLocationBoundaryFeature(location: Location) {
  const boundary = closePolygon(location.boundary ?? []);

  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [boundary.map((point) => [point.lng, point.lat])],
    },
  };
}

export function getNeighborhoodBoundsForMap(neighborhood: Neighborhood): [[number, number], [number, number]] {
  const bounds = getNeighborhoodBounds(neighborhood);
  if (!bounds) {
    return [
      [neighborhood.coordinates.lng, neighborhood.coordinates.lat],
      [neighborhood.coordinates.lng, neighborhood.coordinates.lat],
    ];
  }

  return [
    [bounds[0], bounds[1]],
    [bounds[2], bounds[3]],
  ];
}

export function getRenderNeighborhoods() {
  return MOCK_NEIGHBORHOODS;
}

export function getNeighborhoodAnchor(neighborhood: Neighborhood) {
  return neighborhood.boundary && neighborhood.boundary.length > 2
    ? getPolygonCentroid(neighborhood.boundary)
    : neighborhood.coordinates;
}

export function buildNeighborhoodDisplayItems(
  neighborhoods: Neighborhood[],
  map: MapRef | null,
  zoom: number
): NeighborhoodDisplayItem[] {
  if (!map) {
    return neighborhoods.map((neighborhood) => ({
      id: neighborhood.id,
      type: 'pin',
      anchor: getNeighborhoodAnchor(neighborhood),
      neighborhoods: [neighborhood],
    }));
  }

  const threshold = zoom >= 17 ? 9 : zoom >= 16 ? 15 : zoom >= 15 ? 24 : zoom >= 14.2 ? 38 : zoom >= 13.4 ? 56 : 82;
  const projected = neighborhoods.map((neighborhood) => {
    const anchor = getNeighborhoodAnchor(neighborhood);
    return {
      neighborhood,
      anchor,
      point: map.project([anchor.lng, anchor.lat]),
    };
  });

  const visited = new Set<string>();
  const items: NeighborhoodDisplayItem[] = [];

  for (const current of projected) {
    if (visited.has(current.neighborhood.id)) continue;
    const cluster = [current];
    visited.add(current.neighborhood.id);

    for (const candidate of projected) {
      if (visited.has(candidate.neighborhood.id)) continue;
      if (distance(current.point.x, current.point.y, candidate.point.x, candidate.point.y) < threshold) {
        cluster.push(candidate);
        visited.add(candidate.neighborhood.id);
      }
    }

    if (cluster.length === 1) {
      items.push({
        id: current.neighborhood.id,
        type: 'pin',
        anchor: current.anchor,
        neighborhoods: [current.neighborhood],
      });
      continue;
    }

    items.push({
      id: `cluster-${cluster.map((item) => item.neighborhood.id).join('-')}`,
      type: 'cluster',
      anchor: {
        lng: cluster.reduce((sum, item) => sum + item.anchor.lng, 0) / cluster.length,
        lat: cluster.reduce((sum, item) => sum + item.anchor.lat, 0) / cluster.length,
      },
      neighborhoods: cluster.map((item) => item.neighborhood),
    });
  }

  return items;
}

export function getCombinedNeighborhoodBounds(neighborhoods: Neighborhood[]) {
  return neighborhoods
    .map((neighborhood) => getNeighborhoodBoundsForMap(neighborhood))
    .reduce<[[number, number], [number, number]] | null>((combined, current) => {
      if (!combined) return current;
      return [
        [Math.min(combined[0][0], current[0][0]), Math.min(combined[0][1], current[0][1])],
        [Math.max(combined[1][0], current[1][0]), Math.max(combined[1][1], current[1][1])],
      ];
    }, null);
}

export function buildClusteredListingFeatureCollection(
  listings: Array<{ listing: Listing; markerCoordinates: { lat: number; lng: number } }>,
  excludedIds: Set<string>
): FeatureCollection<Point, ClusteredListingProperties> {
  return {
    type: 'FeatureCollection',
    features: listings
      .filter(({ listing }) => !excludedIds.has(listing.id))
      .map(({ listing, markerCoordinates }) => ({
        type: 'Feature',
        properties: {
          listingId: listing.id,
          price: listing.price,
          priceLabel: formatPrice(listing.price),
        },
        geometry: {
          type: 'Point',
          coordinates: [markerCoordinates.lng, markerCoordinates.lat],
        },
      })),
  };
}

export function getClusterFeature(features?: GeoJSONFeature[] | null) {
  return (features ?? []).find((feature) => feature.layer?.id === CLUSTER_LAYER_ID) as
    | GeoJSONFeature
    | undefined;
}

export function getListingFeature(features?: GeoJSONFeature[] | null) {
  return (features ?? []).find((feature) => {
    const layerId = feature.layer?.id;
    return layerId === UNCLUSTERED_CIRCLE_LAYER_ID || layerId === UNCLUSTERED_LABEL_LAYER_ID;
  }) as GeoJSONFeature | undefined;
}

export function getClusterIdFromFeature(feature: GeoJSONFeature) {
  const clusterId = feature.properties?.cluster_id;
  if (typeof clusterId === 'number') return clusterId;
  if (typeof clusterId === 'string') return Number(clusterId);
  return null;
}

export function getClusterCountFromFeature(feature: GeoJSONFeature) {
  const count = feature.properties?.point_count;
  if (typeof count === 'number') return count;
  if (typeof count === 'string') return Number(count);
  return null;
}

export function getListingIdFromFeature(feature: GeoJSONFeature) {
  const listingId = feature.properties?.listingId;
  return typeof listingId === 'string' ? listingId : null;
}

export function shouldMinimizeListingPin(listingId: string) {
  return hashStringToBucket(listingId) % 2 === 0;
}

export function getSpreadListingCoordinates(listing: Listing, index: number) {
  const offset = LISTING_MARKER_OFFSETS[index % LISTING_MARKER_OFFSETS.length];
  return {
    lat: listing.coordinates.lat + offset.lat,
    lng: listing.coordinates.lng + offset.lng,
  };
}

export function getDesktopHoverCardStyle({
  map,
  coordinates,
  width,
  height,
  edgePadding,
  sideGap,
  pinTopOffset,
}: {
  map: MapRef | null;
  coordinates: { lat: number; lng: number };
  width: number;
  height: number;
  edgePadding: number;
  sideGap: number;
  pinTopOffset: number;
}): { left: number; top: number } | null {
  if (!map) return null;
  const container = map.getContainer();
  const { clientWidth, clientHeight } = container;
  if (!clientWidth || !clientHeight) return null;

  const point = map.project([coordinates.lng, coordinates.lat]);
  const prefersRight = point.x < clientWidth / 2;
  const prefersBelow = point.y < clientHeight / 2;

  const unclampedLeft = prefersRight ? point.x + sideGap : point.x - width - sideGap;
  const unclampedTop = prefersBelow ? point.y - pinTopOffset : point.y - height + pinTopOffset;

  const left = clamp(unclampedLeft, edgePadding, clientWidth - width - edgePadding);
  const top = clamp(unclampedTop, edgePadding, clientHeight - height - edgePadding);

  return { left, top };
}

function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function hashStringToBucket(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
