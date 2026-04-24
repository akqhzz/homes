'use client';
import { useCallback, useRef } from 'react';
import type { Feature, LineString, Polygon } from 'geojson';
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Listing, Location, Neighborhood } from '@/lib/types';
import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { closePolygon, getNeighborhoodBounds } from '@/lib/geo';
import { getMapboxToken } from '@/lib/mapbox-token';
import PriceMarker from '@/components/molecules/PriceMarker';
import NeighborhoodPin from '@/components/molecules/NeighborhoodPin';
import ListingCard from '@/components/molecules/ListingCard';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import { useSavedStore } from '@/store/savedStore';

const MAPBOX_TOKEN = getMapboxToken();
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

  const mapStyle = isSatelliteMode
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : 'mapbox://styles/mapbox/standard';

  const handleMarkerClick = useCallback(
    (listingId: string, coords: { lat: number; lng: number }) => {
      setSelectedListingId(listingId);
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
      setCarouselVisible(!isDesktop);
      // Pan map to show the listing with offset for bottom carousel
      mapRef.current?.flyTo({
        center: [coords.lng, coords.lat],
        zoom: Math.max(viewState.zoom, 14),
        duration: 600,
        offset: isDesktop ? [-140, 0] : [0, -100],
      });
    },
    [setSelectedListingId, setCarouselVisible, viewState.zoom]
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
    ? renderNeighborhoods
    : renderNeighborhoods.filter(
        (nbh) =>
          nbh.id === selectedNeighborhoodId ||
          nbh.id === previewNeighborhoodId ||
          includedNeighborhoodIds?.has(nbh.id)
      );

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
              'fill-color': includedNeighborhoodIds?.has(neighborhood.id) ? '#0F1729' : '#64748B',
              'fill-opacity': includedNeighborhoodIds?.has(neighborhood.id) ? 0.08 : 0.03,
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
              'line-color': includedNeighborhoodIds?.has(neighborhood.id) ? '#0F1729' : '#64748B',
              'line-opacity': includedNeighborhoodIds?.has(neighborhood.id) ? 1 : showNeighborhoods ? 0.5 : 0.42,
              'line-width': includedNeighborhoodIds?.has(neighborhood.id) ? 3 : showNeighborhoods ? 2 : 1.5,
              'line-dasharray': includedNeighborhoodIds?.has(neighborhood.id) ? [1.5, 1] : [1.2, 1.8],
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
                'fill-color': '#0F1729',
                'fill-opacity': 0.06,
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
                'line-color': '#0F1729',
                'line-width': 2.5,
                'line-opacity': 0.72,
                'line-dasharray': [1.5, 1],
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
              'line-color': '#0F1729',
              'line-width': 3,
              'line-dasharray': [1.5, 1],
              'line-emissive-strength': 0.8,
            }}
          />
          {drawnBoundary.length > 2 && (
            <Layer
              id="drawn-search-boundary-fill"
              type="fill"
              paint={{
                'fill-color': '#0F1729',
                'fill-opacity': 0.08,
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
        renderNeighborhoods.map((nbh) => (
          <Marker
            key={nbh.id}
            longitude={nbh.coordinates.lng}
            latitude={nbh.coordinates.lat}
            anchor={isAreaMode ? 'center' : 'bottom'}
          >
            <div onMouseEnter={() => onNeighborhoodHover?.(nbh)} onMouseLeave={() => onNeighborhoodHover?.(null)}>
              <NeighborhoodPin
                neighborhood={nbh}
                isSelected={nbh.id === selectedNeighborhoodId || includedNeighborhoodIds?.has(nbh.id)}
                onClick={() => {
                  if (!isAreaMode) {
                    mapRef.current?.fitBounds(getNeighborhoodBoundsForMap(nbh), {
                      padding: { top: 160, bottom: 180, left: 72, right: 72 },
                      duration: 420,
                      maxZoom: 14.4,
                    });
                  }
                  onNeighborhoodClick?.(nbh);
                }}
                size={isAreaMode ? 'sm' : 'default'}
                showLabel
              />
            </div>
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
            onClick={() => handleMarkerClick(listing.id, listing.coordinates)}
          />
        </Marker>
        );
      })}

      {showListings && selectedListingId && !isCarouselVisible && (() => {
        const selectedListing = listings.find((item) => item.id === selectedListingId);
        if (!selectedListing) return null;
        const markerCoordinates = getSpreadListingCoordinates(selectedListing, listings.findIndex((item) => item.id === selectedListingId));
        const showRight = markerCoordinates.lng < viewState.longitude;
        return (
          <Marker
            longitude={markerCoordinates.lng}
            latitude={markerCoordinates.lat}
            anchor={showRight ? 'left' : 'right'}
            offset={showRight ? [78, -124] : [-16, -124]}
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

function getSpreadListingCoordinates(listing: Listing, index: number) {
  const offset = LISTING_MARKER_OFFSETS[index % LISTING_MARKER_OFFSETS.length];
  return {
    lat: listing.coordinates.lat + offset.lat,
    lng: listing.coordinates.lng + offset.lng,
  };
}
