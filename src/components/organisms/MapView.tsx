'use client';
import { useCallback, useRef } from 'react';
import type { Feature, LineString, Polygon } from 'geojson';
import Map, { Layer, Marker, NavigationControl, Source, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Listing, Neighborhood } from '@/lib/types';
import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import PriceMarker from '@/components/molecules/PriceMarker';
import NeighborhoodPin from '@/components/molecules/NeighborhoodPin';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import { useSavedStore } from '@/store/savedStore';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const MOCK_MAP_BOUNDS = {
  north: 43.695,
  south: 43.635,
  west: -79.44,
  east: -79.345,
};
const AREA_NEIGHBORHOOD_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'nbh-annex': { lat: 43.6815, lng: -79.4190 },
  'nbh-yorkville': { lat: 43.6810, lng: -79.3760 },
  'nbh-kensington': { lat: 43.6575, lng: -79.4235 },
  'nbh-church-st': { lat: 43.6580, lng: -79.3605 },
  'nbh-king-west': { lat: 43.6405, lng: -79.3955 },
};

interface MapViewProps {
  listings: Listing[];
  showNeighborhoods?: boolean;
  showListings?: boolean;
  selectedNeighborhoodId?: string | null;
  includedNeighborhoodIds?: Set<string>;
  onNeighborhoodClick?: (neighborhood: Neighborhood) => void;
  onAreaMapClick?: (coordinates: { lat: number; lng: number }) => void;
  drawnBoundary?: { lat: number; lng: number }[];
  showAmenities?: boolean;
  isAreaMode?: boolean;
}

export default function MapView({
  listings,
  showNeighborhoods = false,
  showListings = true,
  selectedNeighborhoodId,
  includedNeighborhoodIds,
  onNeighborhoodClick,
  onAreaMapClick,
  drawnBoundary = [],
  showAmenities = false,
  isAreaMode = false,
}: MapViewProps) {
  const { viewState, setViewState, selectedListingId, setSelectedListingId } = useMapStore();
  const { setCarouselVisible, isSatelliteMode } = useUIStore();
  const isLiked = useSavedStore((s) => s.isLiked);
  const mapRef = useRef<MapRef | null>(null);

  const mapStyle = isSatelliteMode
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : 'mapbox://styles/mapbox/light-v11';

  const handleMarkerClick = useCallback(
    (listingId: string, coords: { lat: number; lng: number }) => {
      setSelectedListingId(listingId);
      setCarouselVisible(true);
      // Pan map to show the listing with offset for bottom carousel
      mapRef.current?.flyTo({
        center: [coords.lng, coords.lat],
        zoom: Math.max(viewState.zoom, 14),
        duration: 600,
        offset: [0, -100],
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

  const renderNeighborhoods = getRenderNeighborhoods(isAreaMode);
  const boundaryNeighborhoods = renderNeighborhoods.filter(
    (nbh) => nbh.id === selectedNeighborhoodId || includedNeighborhoodIds?.has(nbh.id)
  );

  if (!MAPBOX_TOKEN) {
    return (
      <MockMap
        listings={listings}
        selectedId={selectedListingId}
        onMarkerClick={handleMarkerClick}
        onMapClick={() => { setSelectedListingId(null); setCarouselVisible(false); }}
        showListings={showListings}
        showNeighborhoods={showNeighborhoods}
        selectedNeighborhoodId={selectedNeighborhoodId}
        includedNeighborhoodIds={includedNeighborhoodIds}
        onNeighborhoodClick={onNeighborhoodClick}
        onAreaMapClick={onAreaMapClick}
        drawnBoundary={drawnBoundary}
        showAmenities={showAmenities}
        isAreaMode={isAreaMode}
      />
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
      style={{ width: '100%', height: '100%' }}
      minZoom={9}
      maxZoom={18}
    >
      {!isAreaMode && <NavigationControl position="bottom-right" showCompass={false} style={{ bottom: 280, right: 12 }} />}

      {boundaryNeighborhoods.map((neighborhood) => (
        <Source key={neighborhood.id} id={`neighborhood-boundary-${neighborhood.id}`} type="geojson" data={getNeighborhoodBoundaryFeature(neighborhood)}>
          <Layer
            id={`neighborhood-boundary-fill-${neighborhood.id}`}
            type="fill"
            paint={{
              'fill-color': includedNeighborhoodIds?.has(neighborhood.id) ? '#0F1729' : '#64748B',
              'fill-opacity': 0.08,
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
              'line-color': '#0F1729',
              'line-width': 3,
              'line-dasharray': [1.5, 1],
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
            }}
          />
          {drawnBoundary.length > 2 && (
            <Layer
              id="drawn-search-boundary-fill"
              type="fill"
              paint={{
                'fill-color': '#0F1729',
                'fill-opacity': 0.08,
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
            <NeighborhoodPin
              neighborhood={nbh}
              isSelected={nbh.id === selectedNeighborhoodId || includedNeighborhoodIds?.has(nbh.id)}
              onClick={() => {
                mapRef.current?.fitBounds(getNeighborhoodBounds(nbh), {
                  padding: { top: 160, bottom: 180, left: 72, right: 72 },
                  duration: 420,
                  maxZoom: 14.4,
                });
                onNeighborhoodClick?.(nbh);
              }}
              size={isAreaMode ? 'sm' : 'default'}
            />
          </Marker>
        ))}

      {/* Listing price markers */}
      {showListings && listings.map((listing) => (
        <Marker
          key={listing.id}
          longitude={listing.coordinates.lng}
          latitude={listing.coordinates.lat}
          anchor="bottom"
        >
          <PriceMarker
            price={listing.price}
            isSelected={listing.id === selectedListingId}
            isSaved={isLiked(listing.id)}
            onClick={() => handleMarkerClick(listing.id, listing.coordinates)}
          />
        </Marker>
      ))}
    </Map>
  );
}

function MockMap({
  listings,
  selectedId,
  onMarkerClick,
  onMapClick,
  showListings = true,
  showNeighborhoods = false,
  selectedNeighborhoodId,
  includedNeighborhoodIds,
  onNeighborhoodClick,
  onAreaMapClick,
  drawnBoundary = [],
  showAmenities = false,
  isAreaMode = false,
}: {
  listings: Listing[];
  selectedId: string | null;
  onMarkerClick: (id: string, coords: { lat: number; lng: number }) => void;
  onMapClick: () => void;
  showListings?: boolean;
  showNeighborhoods?: boolean;
  selectedNeighborhoodId?: string | null;
  includedNeighborhoodIds?: Set<string>;
  onNeighborhoodClick?: (neighborhood: Neighborhood) => void;
  onAreaMapClick?: (coordinates: { lat: number; lng: number }) => void;
  drawnBoundary?: { lat: number; lng: number }[];
  showAmenities?: boolean;
  isAreaMode?: boolean;
}) {
  const renderNeighborhoods = getRenderNeighborhoods(isAreaMode);
  const boundaryNeighborhoods = renderNeighborhoods.filter(
    (nbh) => nbh.id === selectedNeighborhoodId || includedNeighborhoodIds?.has(nbh.id)
  );

  return (
    <div
      className="w-full h-full relative"
      onClick={(e) => {
        if (showListings) {
          onMapClick();
          return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        onAreaMapClick?.({
          lat: MOCK_MAP_BOUNDS.north - y * (MOCK_MAP_BOUNDS.north - MOCK_MAP_BOUNDS.south),
          lng: MOCK_MAP_BOUNDS.west + x * (MOCK_MAP_BOUNDS.east - MOCK_MAP_BOUNDS.west),
        });
      }}
    >
      <img src="/map.png" className="absolute inset-0 w-full h-full object-cover" alt="map" draggable={false} />
      {boundaryNeighborhoods.length > 0 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          {boundaryNeighborhoods.map((neighborhood) => (
            <polygon
              key={neighborhood.id}
              points={mockBoundaryPoints(neighborhood)}
              fill="rgba(15,23,41,0.08)"
              stroke="#0F1729"
              strokeDasharray="5 4"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      )}
      {showAmenities && AMENITY_POINTS.map((amenity, i) => (
        <div
          key={amenity.id}
          className="absolute h-2.5 w-2.5 rounded-full border-2 border-white bg-[#0F1729] shadow-sm"
          style={{ left: `${18 + ((i * 19) % 65)}%`, top: `${22 + ((i * 29) % 58)}%` }}
          title={amenity.label}
        />
      ))}
      {showNeighborhoods && renderNeighborhoods.map((nbh) => {
        const { x, y } = mockPointFromCoordinates(nbh.coordinates);
        return (
          <div
            key={nbh.id}
            className="absolute"
            style={{ left: `${x}%`, top: `${y}%`, transform: isAreaMode ? 'translate(-50%, -50%)' : 'translate(-50%, -100%)' }}
            onClick={(e) => { e.stopPropagation(); onNeighborhoodClick?.(nbh); }}
          >
            <NeighborhoodPin
              neighborhood={nbh}
              isSelected={nbh.id === selectedNeighborhoodId || includedNeighborhoodIds?.has(nbh.id)}
              size={isAreaMode ? 'sm' : 'default'}
            />
          </div>
        );
      })}
      {drawnBoundary.length > 0 && (
        <>
          {drawnBoundary.length > 1 && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              points={drawnBoundary.map((point) => `${mockPointFromCoordinates(point).x},${mockPointFromCoordinates(point).y}`).join(' ')}
              fill={drawnBoundary.length > 2 ? 'rgba(15,23,41,0.08)' : 'none'}
              stroke="#0F1729"
              strokeDasharray="6 4"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            </svg>
          )}
          {drawnBoundary.map((point, index) => {
            const { x, y } = mockPointFromCoordinates(point);
            return (
              <div
                key={`${point.lat}-${point.lng}-${index}`}
                className="absolute h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0F1729] shadow-[0_1px_2px_rgba(15,23,41,0.2)]"
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            );
          })}
        </>
      )}
      {showListings && listings.map((listing, i) => {
        const x = 8 + ((i * 37 + 13) % 75);
        const y = 8 + ((i * 53 + 7) % 70);
        return (
          <div
            key={listing.id}
            className="absolute"
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={(e) => { e.stopPropagation(); onMarkerClick(listing.id, listing.coordinates); }}
          >
            <PriceMarker
              price={listing.price}
              isSelected={listing.id === selectedId}
            />
          </div>
        );
      })}
    </div>
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
  const { lat, lng } = neighborhood.coordinates;
  const boundary = normalizeBoundaryAroundPin(neighborhood, neighborhood.boundary ?? [
    { lat: lat + 0.011, lng: lng - 0.012 },
    { lat: lat + 0.012, lng: lng + 0.011 },
    { lat: lat + 0.001, lng: lng + 0.016 },
    { lat: lat - 0.011, lng: lng + 0.006 },
    { lat: lat - 0.009, lng: lng - 0.014 },
    { lat: lat + 0.011, lng: lng - 0.012 },
  ]);

  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [boundary.map((point) => [point.lng, point.lat])],
    },
  };
}

function mockBoundaryPoints(neighborhood: Neighborhood) {
  const boundary = neighborhood.boundary ? normalizeBoundaryAroundPin(neighborhood, neighborhood.boundary) : [];
  if (boundary.length > 2) {
    return boundary
      .map((point) => {
        const { x, y } = mockPointFromCoordinates(point);
        return `${x},${y}`;
      })
      .join(' ');
  }
  return '50,0 100,24 82,74 0,93 10,36';
}

function normalizeBoundaryAroundPin(
  neighborhood: Neighborhood,
  boundary: { lat: number; lng: number }[]
) {
  if (boundary.length < 3) return boundary;

  const openBoundary = boundary.slice(0, -1);
  const lats = openBoundary.map((point) => point.lat);
  const lngs = openBoundary.map((point) => point.lng);
  const center = {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };
  const scale = 1.24;
  const shifted = openBoundary.map((point) => ({
    lat: neighborhood.coordinates.lat + (point.lat - center.lat) * scale,
    lng: neighborhood.coordinates.lng + (point.lng - center.lng) * scale,
  }));

  return [...shifted, shifted[0]];
}

function mockPointFromCoordinates(point: { lat: number; lng: number }) {
  return {
    x: ((point.lng - MOCK_MAP_BOUNDS.west) / (MOCK_MAP_BOUNDS.east - MOCK_MAP_BOUNDS.west)) * 100,
    y: ((MOCK_MAP_BOUNDS.north - point.lat) / (MOCK_MAP_BOUNDS.north - MOCK_MAP_BOUNDS.south)) * 100,
  };
}

function getNeighborhoodBounds(neighborhood: Neighborhood): [[number, number], [number, number]] {
  const boundary = normalizeBoundaryAroundPin(neighborhood, neighborhood.boundary ?? []);
  const points = boundary.length > 0 ? boundary : [neighborhood.coordinates];
  const lngs = points.map((point) => point.lng);
  const lats = points.map((point) => point.lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

function getRenderNeighborhoods(isAreaMode: boolean) {
  if (!isAreaMode) return MOCK_NEIGHBORHOODS;

  return MOCK_NEIGHBORHOODS
    .filter((neighborhood) => AREA_NEIGHBORHOOD_COORDINATES[neighborhood.id])
    .map((neighborhood) => ({
      ...neighborhood,
      coordinates: AREA_NEIGHBORHOOD_COORDINATES[neighborhood.id],
    }));
}
