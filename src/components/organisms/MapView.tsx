'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Feature, LineString, Polygon } from 'geojson';
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Listing, Location, Neighborhood } from '@/lib/types';
import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { closePolygon, getNeighborhoodBounds, getPolygonCentroid } from '@/lib/geo';
import { getMapboxToken } from '@/lib/mapbox-token';
import PriceMarker from '@/components/molecules/PriceMarker';
import NeighborhoodPin from '@/components/molecules/NeighborhoodPin';
import ListingCard from '@/components/molecules/ListingCard';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import { useSavedStore } from '@/store/savedStore';

const MAPBOX_TOKEN = getMapboxToken();
// Boundary system: active boundaries are used for applied search/area selections and draw mode.
// Preview boundaries are hover-only in area-select and intentionally lighter/dashed.
const ACTIVE_BOUNDARY_STYLE = {
  lineColor: '#64748B',
  lineOpacity: 0.78,
  lineWidth: 1.15,
  lineDasharray: [1, 0],
  fillColor: '#0F1729',
  fillOpacity: 0.04,
};

const PREVIEW_BOUNDARY_STYLE = {
  lineColor: '#94A3B8',
  lineOpacity: 0.65,
  lineWidth: 1,
  lineDasharray: [2, 2],
  fillColor: '#CBD5E1',
  fillOpacity: 0.02,
};

const LISTING_MARKER_OFFSETS = [
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

interface MapViewProps {
  listings: Listing[];
  showNeighborhoods?: boolean;
  showListings?: boolean;
  selectedNeighborhoodId?: string | null;
  previewNeighborhoodId?: string | null;
  includedNeighborhoodIds?: Set<string>;
  onNeighborhoodClick?: (neighborhood: Neighborhood) => void;
  onNeighborhoodHover?: (neighborhood: Neighborhood | null) => void;
  onAreaMapClick?: (coordinates: { lat: number; lng: number }) => void;
  drawnBoundary?: { lat: number; lng: number }[];
  searchedLocations?: Location[];
  showAmenities?: boolean;
  isAreaMode?: boolean;
}

export default function MapView({
  listings,
  showNeighborhoods = false,
  showListings = true,
  selectedNeighborhoodId,
  previewNeighborhoodId,
  includedNeighborhoodIds,
  onNeighborhoodClick,
  onNeighborhoodHover,
  onAreaMapClick,
  drawnBoundary = [],
  searchedLocations = [],
  showAmenities = false,
  isAreaMode = false,
}: MapViewProps) {
  const { viewState, setViewState, selectedListingId, setSelectedListingId, hoveredListingId } = useMapStore();
  const { setCarouselVisible, isSatelliteMode, isCarouselVisible } = useUIStore();
  const isLiked = useSavedStore((s) => s.isLiked);
  const mapRef = useRef<MapRef | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [neighborhoodDisplayItems, setNeighborhoodDisplayItems] = useState<NeighborhoodDisplayItem[]>([]);

  const mapStyle = isSatelliteMode
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : 'mapbox://styles/mapbox/standard';

  const handleMarkerClick = useCallback(
    (listingId: string) => {
      setSelectedListingId(listingId);
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
      setCarouselVisible(!isDesktop);
    },
    [setSelectedListingId, setCarouselVisible]
  );

  const handleMapClick = useCallback(() => {
    if (!showListings) return;
    setSelectedListingId(null);
    setCarouselVisible(false);
  }, [setSelectedListingId, setCarouselVisible, showListings]);

  const handleMapPointer = useCallback((e: { lngLat: { lat: number; lng: number } }) => {
    if (showListings) {
      handleMapClick();
      return;
    }
    onAreaMapClick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  }, [handleMapClick, onAreaMapClick, showListings]);

  const renderNeighborhoods = getRenderNeighborhoods();
  const boundaryNeighborhoods = showNeighborhoods
    ? renderNeighborhoods.filter(
        (nbh) =>
          nbh.id === selectedNeighborhoodId ||
          nbh.id === previewNeighborhoodId ||
          includedNeighborhoodIds?.has(nbh.id)
      )
    : renderNeighborhoods.filter(
        (nbh) =>
          nbh.id === selectedNeighborhoodId ||
          nbh.id === previewNeighborhoodId ||
          includedNeighborhoodIds?.has(nbh.id)
      );

  useEffect(() => {
    if (!mapLoaded) return;

    setNeighborhoodDisplayItems(
      buildNeighborhoodDisplayItems(renderNeighborhoods, mapRef.current, viewState.zoom)
    );
  }, [mapLoaded, renderNeighborhoods, viewState.zoom]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#E8ECEF] p-6 text-center">
        <div className="max-w-sm rounded-3xl bg-white/90 px-5 py-4 shadow-[var(--shadow-control)]">
          <p className="type-label text-[#0F1729]">Mapbox token not loaded</p>
          <p className="mt-1 type-caption text-[#6B7280]">
            Restart the Next.js server after adding `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env.local`.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(e) => setViewState(e.viewState)}
      onLoad={() => setMapLoaded(true)}
      onClick={handleMapPointer}
      mapStyle={mapStyle}
      mapboxAccessToken={MAPBOX_TOKEN}
      config={{
        basemap: {
          theme: 'faded',
          lightPreset: 'day',
          show3dObjects: false,
        },
      }}
      style={{ width: '100%', height: '100%' }}
      minZoom={9}
      maxZoom={18}
    >
      {boundaryNeighborhoods.map((neighborhood) => (
        <Source key={neighborhood.id} id={`neighborhood-boundary-${neighborhood.id}`} type="geojson" data={getNeighborhoodBoundaryFeature(neighborhood)}>
          <Layer
            id={`neighborhood-boundary-fill-${neighborhood.id}`}
            type="fill"
            paint={{
              'fill-color': getBoundaryPaintState(neighborhood.id, includedNeighborhoodIds, previewNeighborhoodId).fillColor,
              'fill-opacity': getBoundaryPaintState(neighborhood.id, includedNeighborhoodIds, previewNeighborhoodId).fillOpacity,
              'fill-emissive-strength': 0.2,
            }}
          />
          <Layer
            id={`neighborhood-boundary-line-${neighborhood.id}`}
            type="line"
            layout={{
              'line-join': 'round',
              'line-cap': 'round',
            }}
            paint={{
              'line-color': getBoundaryPaintState(neighborhood.id, includedNeighborhoodIds, previewNeighborhoodId).lineColor,
              'line-opacity': getBoundaryPaintState(neighborhood.id, includedNeighborhoodIds, previewNeighborhoodId).lineOpacity,
              'line-width': getBoundaryPaintState(neighborhood.id, includedNeighborhoodIds, previewNeighborhoodId).lineWidth,
              'line-dasharray': getBoundaryPaintState(neighborhood.id, includedNeighborhoodIds, previewNeighborhoodId).lineDasharray,
              'line-emissive-strength': 0.8,
            }}
          />
        </Source>
      ))}

      {!isAreaMode && searchedLocations
        .filter((location) => (location.boundary?.length ?? 0) > 2)
        .map((location) => (
          <Source
            key={location.id}
            id={`searched-location-boundary-${location.id}`}
            type="geojson"
            data={getLocationBoundaryFeature(location)}
          >
            <Layer
              id={`searched-location-boundary-fill-${location.id}`}
              type="fill"
              paint={{
                'fill-color': ACTIVE_BOUNDARY_STYLE.fillColor,
                'fill-opacity': ACTIVE_BOUNDARY_STYLE.fillOpacity,
                'fill-emissive-strength': 0.22,
              }}
            />
            <Layer
              id={`searched-location-boundary-line-${location.id}`}
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
              paint={{
                'line-color': ACTIVE_BOUNDARY_STYLE.lineColor,
                'line-width': ACTIVE_BOUNDARY_STYLE.lineWidth,
                'line-opacity': ACTIVE_BOUNDARY_STYLE.lineOpacity,
                'line-dasharray': ACTIVE_BOUNDARY_STYLE.lineDasharray,
                'line-emissive-strength': 0.8,
              }}
            />
          </Source>
        ))}

      {drawnBoundary.length > 1 && (
        <Source id="drawn-search-boundary" type="geojson" data={getDrawnBoundaryFeature(drawnBoundary)}>
          <Layer
            id="drawn-search-boundary-line"
            type="line"
            layout={{
              'line-join': 'round',
              'line-cap': 'round',
            }}
            paint={{
              'line-color': ACTIVE_BOUNDARY_STYLE.lineColor,
              'line-width': ACTIVE_BOUNDARY_STYLE.lineWidth,
              'line-opacity': ACTIVE_BOUNDARY_STYLE.lineOpacity,
              'line-dasharray': ACTIVE_BOUNDARY_STYLE.lineDasharray,
              'line-emissive-strength': 0.8,
            }}
          />
          {drawnBoundary.length > 2 && (
            <Layer
              id="drawn-search-boundary-fill"
              type="fill"
              paint={{
                'fill-color': ACTIVE_BOUNDARY_STYLE.fillColor,
                'fill-opacity': ACTIVE_BOUNDARY_STYLE.fillOpacity,
                'fill-emissive-strength': 0.22,
              }}
            />
          )}
        </Source>
      )}

      {drawnBoundary.map((point, index) => (
        <Marker
          key={`draw-point-${point.lat}-${point.lng}-${index}`}
          longitude={point.lng}
          latitude={point.lat}
          anchor="center"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-[#0F1729] shadow-[0_1px_2px_rgba(15,23,41,0.24)]" />
        </Marker>
      ))}

      {/* Neighbourhood pins (shown at lower zoom or in area-select mode) */}
      {showAmenities && AMENITY_POINTS.map((amenity) => (
        <Marker
          key={amenity.id}
          longitude={amenity.lng}
          latitude={amenity.lat}
          anchor="center"
        >
          <div className="h-2.5 w-2.5 rounded-full border-2 border-white bg-[#0F1729] shadow-sm" title={amenity.label} />
        </Marker>
      ))}

      {showNeighborhoods &&
        neighborhoodDisplayItems.map((item) => (
          <Marker
            key={item.id}
            longitude={item.anchor.lng}
            latitude={item.anchor.lat}
            anchor="center"
          >
            {item.type === 'cluster' ? (
              <NeighborhoodPin
                neighborhood={item.neighborhoods[0]}
                variant="cluster"
                count={item.neighborhoods.length}
                onClick={() => {
                  const bounds = getCombinedNeighborhoodBounds(item.neighborhoods);
                  if (!bounds) return;
                  mapRef.current?.fitBounds(bounds, {
                    padding: { top: 140, bottom: 180, left: 48, right: 48 },
                    duration: 380,
                    maxZoom: Math.max(viewState.zoom + 1.3, 14.8),
                  });
                }}
              />
            ) : (
              <div
                onMouseEnter={() => onNeighborhoodHover?.(item.neighborhoods[0])}
                onMouseLeave={() => onNeighborhoodHover?.(null)}
              >
                <NeighborhoodPin
                  neighborhood={item.neighborhoods[0]}
                  isSelected={
                    item.neighborhoods[0].id === selectedNeighborhoodId ||
                    includedNeighborhoodIds?.has(item.neighborhoods[0].id)
                  }
                  onClick={() => {
                    if (!isAreaMode) {
                      mapRef.current?.fitBounds(getNeighborhoodBoundsForMap(item.neighborhoods[0]), {
                        padding: { top: 160, bottom: 180, left: 72, right: 72 },
                        duration: 420,
                        maxZoom: 14.4,
                      });
                    }
                    onNeighborhoodClick?.(item.neighborhoods[0]);
                  }}
                  variant="default"
                  size={isAreaMode ? 'sm' : 'default'}
                  showLabel
                />
              </div>
            )}
          </Marker>
        ))}

      {/* Listing price markers */}
      {showListings && listings.map((listing, index) => {
        const markerCoordinates = getSpreadListingCoordinates(listing, index);
        return (
        <Marker
          key={listing.id}
          longitude={markerCoordinates.lng}
          latitude={markerCoordinates.lat}
          anchor="bottom"
        >
          <PriceMarker
            price={listing.price}
            isSelected={listing.id === selectedListingId || listing.id === hoveredListingId}
            isSaved={isLiked(listing.id)}
            onClick={() => handleMarkerClick(listing.id)}
          />
        </Marker>
        );
      })}

      {showListings && selectedListingId && !isCarouselVisible && (() => {
        const selectedListing = listings.find((item) => item.id === selectedListingId);
        if (!selectedListing) return null;
        const markerCoordinates = getSpreadListingCoordinates(selectedListing, listings.findIndex((item) => item.id === selectedListingId));
        const showRight = markerCoordinates.lng < viewState.longitude;
        const isUpperHalf = markerCoordinates.lat > viewState.latitude;
        return (
          <Marker
            longitude={markerCoordinates.lng}
            latitude={markerCoordinates.lat}
            anchor={showRight ? 'left' : 'right'}
            offset={showRight ? [58, isUpperHalf ? -72 : -118] : [-34, isUpperHalf ? -72 : -118]}
          >
            <div onClick={(event) => event.stopPropagation()} className="hidden w-72 lg:block">
              <ListingCard listing={selectedListing} variant="carousel" />
            </div>
          </Marker>
        );
      })()}
    </Map>
  );
}

const AMENITY_POINTS = [
  { id: 'amenity-transit-1', label: 'Transit', lat: 43.657, lng: -79.391 },
  { id: 'amenity-park-1', label: 'Park', lat: 43.663, lng: -79.404 },
  { id: 'amenity-school-1', label: 'School', lat: 43.651, lng: -79.382 },
  { id: 'amenity-grocery-1', label: 'Grocery', lat: 43.646, lng: -79.398 },
  { id: 'amenity-cafe-1', label: 'Cafe', lat: 43.668, lng: -79.374 },
];

function getDrawnBoundaryFeature(points: { lat: number; lng: number }[]): Feature<LineString | Polygon> {
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

function getNeighborhoodBoundaryFeature(neighborhood: Neighborhood) {
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

function getLocationBoundaryFeature(location: Location) {
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

function getNeighborhoodBoundsForMap(neighborhood: Neighborhood): [[number, number], [number, number]] {
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

function getRenderNeighborhoods() {
  return MOCK_NEIGHBORHOODS;
}

function getBoundaryPaintState(
  neighborhoodId: string,
  includedNeighborhoodIds?: Set<string>,
  previewNeighborhoodId?: string | null
) {
  const isPreview = previewNeighborhoodId === neighborhoodId && !includedNeighborhoodIds?.has(neighborhoodId);
  return isPreview ? PREVIEW_BOUNDARY_STYLE : ACTIVE_BOUNDARY_STYLE;
}

function getNeighborhoodAnchor(neighborhood: Neighborhood) {
  return neighborhood.boundary && neighborhood.boundary.length > 2
    ? getPolygonCentroid(neighborhood.boundary)
    : neighborhood.coordinates;
}

type NeighborhoodDisplayItem =
  | { id: string; type: 'cluster'; anchor: { lat: number; lng: number }; neighborhoods: Neighborhood[] }
  | { id: string; type: 'pin'; anchor: { lat: number; lng: number }; neighborhoods: [Neighborhood] };

function buildNeighborhoodDisplayItems(
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

  const threshold = zoom >= 14.2 ? 44 : zoom >= 13.4 ? 62 : 84;
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

function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function getCombinedNeighborhoodBounds(neighborhoods: Neighborhood[]) {
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

function getSpreadListingCoordinates(listing: Listing, index: number) {
  const offset = LISTING_MARKER_OFFSETS[index % LISTING_MARKER_OFFSETS.length];
  return {
    lat: listing.coordinates.lat + offset.lat,
    lng: listing.coordinates.lng + offset.lng,
  };
}
