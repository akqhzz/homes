'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Feature, FeatureCollection, LineString, Point, Polygon } from 'geojson';
import type { GeoJSONFeature, GeoJSONSource, MapLayerMouseEvent } from 'mapbox-gl';
import Map, { Layer, Marker, Source, type LayerProps, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Listing, Location, Neighborhood } from '@/lib/types';
import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { closePolygon, getNeighborhoodBounds, getPolygonCentroid } from '@/lib/geo';
import { getMapboxToken } from '@/lib/mapbox-token';
import { formatPrice } from '@/lib/utils/format';
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
  lineColor: '#21503F',
  lineOpacity: 0.96,
  lineWidth: 0.9,
  lineDasharray: [1, 0],
  fillColor: '#337B61',
  fillOpacity: 0.05,
};

const PREVIEW_BOUNDARY_STYLE = {
  lineColor: '#86BEA7',
  lineOpacity: 0.78,
  lineWidth: 0.9,
  lineDasharray: [2, 2],
  fillColor: ACTIVE_BOUNDARY_STYLE.fillColor,
  fillOpacity: ACTIVE_BOUNDARY_STYLE.fillOpacity,
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
const HOVER_CARD_WIDTH = 288;
const HOVER_CARD_HEIGHT = 252;
const HOVER_CARD_EDGE_PADDING = 16;
const HOVER_CARD_SIDE_GAP = 24;
const HOVER_CARD_PIN_TOP_OFFSET = 20;
const CLUSTER_SOURCE_ID = 'listing-clusters-source';
const CLUSTER_LAYER_ID = 'listing-clusters';
const CLUSTER_COUNT_LAYER_ID = 'listing-cluster-count';
const UNCLUSTERED_CIRCLE_LAYER_ID = 'listing-unclustered-circle';
const UNCLUSTERED_LABEL_LAYER_ID = 'listing-unclustered-label';
const CLUSTER_TRANSITION_ZOOM = 13.8;

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
  const {
    viewState,
    setViewState,
    selectedListingId,
    setSelectedListingId,
    hoveredListingId,
    setHoveredListingId,
    mobileCarouselListingId,
    setMobileCarouselListingId,
    visitedListingIds,
    markVisitedListing,
    setViewportBounds,
  } = useMapStore();
  const { setCarouselVisible, isSatelliteMode, isCarouselVisible, isDesktopMapExpanded, setDesktopMapExpanded } = useUIStore();
  const isLiked = useSavedStore((s) => s.isLiked);
  const mapRef = useRef<MapRef | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<MapRef | null>(null);
  const [neighborhoodDisplayItems, setNeighborhoodDisplayItems] = useState<NeighborhoodDisplayItem[]>([]);
  const [previewListingId, setPreviewListingId] = useState<string | null>(null);
  const [clusterRenderItems, setClusterRenderItems] = useState<ClusterRenderItem[]>([]);

  const mapStyle = isSatelliteMode
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : 'mapbox://styles/mapbox/standard';
  const isDesktopViewport = typeof window !== 'undefined' && window.innerWidth >= 1024;

  const handleMarkerClick = useCallback(
    (listingId: string) => {
      if (isDesktopViewport) {
        setSelectedListingId(null);
        setPreviewListingId(previewListingId === listingId ? null : listingId);
        markVisitedListing(listingId);
        setCarouselVisible(false);
        return;
      }
      setSelectedListingId(null);
      setMobileCarouselListingId(listingId, 'marker');
      markVisitedListing(listingId);
      setCarouselVisible(true);
    },
    [isDesktopViewport, markVisitedListing, previewListingId, setCarouselVisible, setMobileCarouselListingId, setPreviewListingId, setSelectedListingId]
  );

  const handleMapClick = useCallback(() => {
    if (!showListings) return;
    setSelectedListingId(null);
    setHoveredListingId(null);
    setMobileCarouselListingId(null, null);
    setPreviewListingId(null);
    setCarouselVisible(false);
  }, [setCarouselVisible, setHoveredListingId, setMobileCarouselListingId, setPreviewListingId, setSelectedListingId, showListings]);

  const handleMapMoveStart = useCallback(() => {
    if (!showListings) return;
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    if (!isDesktop) return;
    setSelectedListingId(null);
    setHoveredListingId(null);
    setMobileCarouselListingId(null, null);
    setPreviewListingId(null);
    setCarouselVisible(false);
  }, [setCarouselVisible, setHoveredListingId, setMobileCarouselListingId, setPreviewListingId, setSelectedListingId, showListings]);

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

  useEffect(() => {
    if (!mapLoaded) return;
    const resizeMap = () => mapRef.current?.resize();
    const frame = requestAnimationFrame(() => {
      resizeMap();
      requestAnimationFrame(resizeMap);
    });
    return () => cancelAnimationFrame(frame);
  }, [isDesktopMapExpanded, mapLoaded]);

  const indexedListings = useMemo(
    () =>
      listings.map((listing, index) => ({
        listing,
        index,
        markerCoordinates: getSpreadListingCoordinates(listing, index),
      })),
    [listings]
  );
  const listingIndexById = useMemo(
    () => new globalThis.Map(indexedListings.map((entry) => [entry.listing.id, entry])),
    [indexedListings]
  );
  const visitedListingIdSet = useMemo(() => new Set(visitedListingIds), [visitedListingIds]);
  const savedListingIdSet = useMemo(
    () => new Set(listings.filter((listing) => isLiked(listing.id)).map((listing) => listing.id)),
    [isLiked, listings]
  );
  const useClusteredListingLayers = showListings && viewState.zoom < CLUSTER_TRANSITION_ZOOM;
  const desktopPreviewListing =
    isDesktopViewport && previewListingId
      ? listingIndexById.get(previewListingId)?.listing ?? null
      : null;
  const desktopPreviewStyle = useMemo(() => {
    if (!desktopPreviewListing || !mapInstance) return null;
    const previewEntry = listingIndexById.get(desktopPreviewListing.id);
    if (!previewEntry) return null;
    return getDesktopHoverCardStyle(
      mapInstance,
      previewEntry.markerCoordinates
    );
  }, [desktopPreviewListing, listingIndexById, mapInstance]);
  const orderedListings = useMemo(
    () => {
      return indexedListings
        .map(({ listing, index, markerCoordinates }) => ({
          listing,
          index,
          markerCoordinates,
          isActive: isDesktopViewport
            ? listing.id === selectedListingId ||
              listing.id === hoveredListingId ||
              listing.id === previewListingId
            : listing.id === mobileCarouselListingId,
        }))
        .sort((a, b) => Number(a.isActive) - Number(b.isActive));
    },
    [hoveredListingId, indexedListings, isDesktopViewport, mobileCarouselListingId, previewListingId, selectedListingId]
  );
  const overlayListingIdSet = useMemo(() => {
    const ids = new Set<string>();
    if (selectedListingId) ids.add(selectedListingId);
    if (mobileCarouselListingId) ids.add(mobileCarouselListingId);
    savedListingIdSet.forEach((id) => ids.add(id));
    visitedListingIdSet.forEach((id) => ids.add(id));
    return ids;
  }, [mobileCarouselListingId, savedListingIdSet, selectedListingId, visitedListingIdSet]);
  const overlayListings = useMemo(
    () => orderedListings.filter(({ listing }) => overlayListingIdSet.has(listing.id)),
    [orderedListings, overlayListingIdSet]
  );
  const clusteredListingData = useMemo(
    () => buildClusteredListingFeatureCollection(indexedListings, overlayListingIdSet),
    [indexedListings, overlayListingIdSet]
  );
  const shouldUseClusterDataSource = showListings && listings.length > 0;
  const visibleClusterListingIdSet = useMemo(
    () => new Set(clusterRenderItems.filter((item) => item.type === 'listing').map((item) => item.listingId)),
    [clusterRenderItems]
  );
  const highlightedClusterId = useMemo(() => {
    if (!useClusteredListingLayers) return null;
    const targetId = hoveredListingId;
    if (!targetId) return null;
    if (overlayListingIdSet.has(targetId)) return null;
    if (visibleClusterListingIdSet.has(targetId)) return null;
    const targetEntry = listingIndexById.get(targetId);
    if (!targetEntry) return null;

    let nearestCluster: { clusterId: number; distance: number } | null = null;

    for (const item of clusterRenderItems) {
      if (item.type !== 'cluster') continue;
      const distanceToCluster = Math.hypot(
        item.coordinates.lng - targetEntry.markerCoordinates.lng,
        item.coordinates.lat - targetEntry.markerCoordinates.lat
      );

      if (!nearestCluster || distanceToCluster < nearestCluster.distance) {
        nearestCluster = { clusterId: item.clusterId, distance: distanceToCluster };
      }
    }

    return nearestCluster?.clusterId ?? null;
  }, [clusterRenderItems, hoveredListingId, listingIndexById, overlayListingIdSet, useClusteredListingLayers, visibleClusterListingIdSet]);

  const handleClusterExpand = useCallback((clusterId: number, coordinates: [number, number]) => {
    const source = mapRef.current?.getSource(CLUSTER_SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) return;
    source.getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (error || zoom == null) return;
      mapRef.current?.easeTo({
        center: coordinates,
        zoom,
        duration: 380,
      });
    });
  }, []);

  const refreshClusterRenderItems = useCallback(() => {
    if (!mapLoaded || !useClusteredListingLayers) return;

    const map = mapRef.current?.getMap();
    if (!map) return;
    if (!map.getLayer(CLUSTER_LAYER_ID) || !map.getLayer(UNCLUSTERED_CIRCLE_LAYER_ID)) return;

    const features = map.queryRenderedFeatures({
      layers: [CLUSTER_LAYER_ID, UNCLUSTERED_CIRCLE_LAYER_ID],
    });

    const nextItems = new globalThis.Map<string, ClusterRenderItem>();

    for (const feature of features) {
      const geometry = feature.geometry;
      if (geometry.type !== 'Point') continue;
      const layerId = feature.layer?.id;
      if (!layerId) continue;

      if (layerId === CLUSTER_LAYER_ID) {
        const clusterId = getClusterIdFromFeature(feature);
        const count = getClusterCountFromFeature(feature);
        if (clusterId == null || count == null) continue;
        nextItems.set(`cluster-${clusterId}`, {
          id: `cluster-${clusterId}`,
          type: 'cluster',
          clusterId,
          count,
          coordinates: {
            lng: geometry.coordinates[0],
            lat: geometry.coordinates[1],
          },
        });
        continue;
      }

      const listingId = getListingIdFromFeature(feature);
      if (!listingId) continue;
      nextItems.set(`listing-${listingId}`, {
        id: `listing-${listingId}`,
        type: 'listing',
        listingId,
        coordinates: {
          lng: geometry.coordinates[0],
          lat: geometry.coordinates[1],
        },
      });
    }

    setClusterRenderItems(Array.from(nextItems.values()));
  }, [mapLoaded, useClusteredListingLayers]);

  const handleSourceLayerHover = useCallback((event: MapLayerMouseEvent) => {
    if (!showListings || !isDesktopViewport || !useClusteredListingLayers) return;

    const clusterFeature = getClusterFeature(event.features);
    const listingFeature = getListingFeature(event.features);
    const canvas = mapRef.current?.getMap().getCanvas();
    if (canvas) {
      canvas.style.cursor = clusterFeature || listingFeature ? 'pointer' : '';
    }
  }, [
    isDesktopViewport,
    showListings,
    useClusteredListingLayers,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    return () => {
      const canvas = map?.getMap().getCanvas();
      if (canvas) canvas.style.cursor = '';
    };
  }, []);

  useEffect(() => {
    if (useClusteredListingLayers) return;
    const canvas = mapRef.current?.getMap().getCanvas();
    if (canvas) canvas.style.cursor = '';
  }, [useClusteredListingLayers]);

  useEffect(() => {
    if (!useClusteredListingLayers) return;

    const frame = requestAnimationFrame(refreshClusterRenderItems);
    return () => cancelAnimationFrame(frame);
  }, [refreshClusterRenderItems, useClusteredListingLayers, viewState.latitude, viewState.longitude, viewState.zoom, clusteredListingData]);

  const handleMapPointer = useCallback((event: MapLayerMouseEvent) => {
    if (showListings) {
      if (useClusteredListingLayers) {
        const clusterFeature = getClusterFeature(event.features);
        if (clusterFeature) {
          const clusterId = getClusterIdFromFeature(clusterFeature);
          const geometry = clusterFeature.geometry as Point;
          if (clusterId != null) {
            handleClusterExpand(clusterId, [geometry.coordinates[0], geometry.coordinates[1]]);
            return;
          }
        }

        const listingFeature = getListingFeature(event.features);
        const listingId = listingFeature ? getListingIdFromFeature(listingFeature) : null;
        if (listingId) {
          handleMarkerClick(listingId);
          return;
        }
      }

      handleMapClick();
      return;
    }

    onAreaMapClick?.({ lat: event.lngLat.lat, lng: event.lngLat.lng });
  }, [handleClusterExpand, handleMapClick, handleMarkerClick, onAreaMapClick, showListings, useClusteredListingLayers]);

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
    <div className="relative h-full w-full overflow-hidden">
      {showListings && isDesktopViewport && (
        <button
          type="button"
          onClick={() => setDesktopMapExpanded(!isDesktopMapExpanded)}
          className="absolute right-5 top-5 z-20 hidden h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] shadow-[var(--shadow-control)] transition-colors hover:bg-[var(--color-surface)] lg:flex"
          aria-label={isDesktopMapExpanded ? 'Collapse map' : 'Expand map'}
        >
          {isDesktopMapExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      )}
      <Map
        ref={mapRef}
        {...viewState}
        onMoveStart={handleMapMoveStart}
        onMove={(e) => setViewState(e.viewState)}
        onIdle={() => {
          const bounds = mapRef.current?.getBounds();
          if (bounds) {
            setViewportBounds([
              bounds.getWest(),
              bounds.getSouth(),
              bounds.getEast(),
              bounds.getNorth(),
            ]);
          }
          if (useClusteredListingLayers) refreshClusterRenderItems();
        }}
        onMouseMove={handleSourceLayerHover}
        onLoad={() => {
          setMapLoaded(true);
          setMapInstance(mapRef.current);
          const bounds = mapRef.current?.getBounds();
          if (bounds) {
            setViewportBounds([
              bounds.getWest(),
              bounds.getSouth(),
              bounds.getEast(),
              bounds.getNorth(),
            ]);
          }
        }}
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
      {boundaryNeighborhoods.map((neighborhood) => {
        const paintState = getBoundaryPaintState(
          neighborhood.id,
          includedNeighborhoodIds,
          previewNeighborhoodId
        );

        return (
        <Source key={neighborhood.id} id={`neighborhood-boundary-${neighborhood.id}`} type="geojson" data={getNeighborhoodBoundaryFeature(neighborhood)}>
          <Layer
            id={`neighborhood-boundary-fill-${neighborhood.id}`}
            type="fill"
            paint={{
              'fill-color': paintState.fillColor,
              'fill-opacity': paintState.fillOpacity,
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
              'line-color': paintState.lineColor,
              'line-opacity': paintState.lineOpacity,
              'line-width': paintState.lineWidth,
              'line-dasharray': paintState.lineDasharray,
              'line-emissive-strength': 0.8,
            }}
          />
        </Source>
        );
      })}

      {searchedLocations
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
          <div className="h-1.5 w-1.5 rounded-full bg-[#21503F] shadow-[0_1px_2px_rgba(15,23,41,0.24)]" />
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
                    maxZoom: 18,
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

      {shouldUseClusterDataSource && useClusteredListingLayers && clusteredListingData.features.length > 0 && (
        <Source
          id={CLUSTER_SOURCE_ID}
          type="geojson"
          data={clusteredListingData}
          cluster
          clusterMaxZoom={13}
          clusterRadius={42}
        >
          <Layer {...LISTING_CLUSTER_LAYER} />
          <Layer {...LISTING_CLUSTER_COUNT_LAYER} />
          <Layer {...LISTING_UNCLUSTERED_CIRCLE_LAYER} />
          <Layer {...LISTING_UNCLUSTERED_LABEL_LAYER} />
        </Source>
      )}

      {/* Listing price markers */}
      {showListings &&
        (useClusteredListingLayers
          ? clusterRenderItems.map((item) => {
              if (item.type === 'cluster') {
                return (
                  <Marker
                    key={item.id}
                    longitude={item.coordinates.lng}
                    latitude={item.coordinates.lat}
                    anchor="center"
                  >
                    <button
                      type="button"
                      className={item.clusterId === highlightedClusterId ? 'map-cluster-marker is-highlighted' : 'map-cluster-marker'}
                      onClick={() => handleClusterExpand(item.clusterId, [item.coordinates.lng, item.coordinates.lat])}
                      aria-label={`Expand ${item.count} listings`}
                    >
                      {item.count}
                    </button>
                  </Marker>
                );
              }

              const entry = listingIndexById.get(item.listingId);
              if (!entry) return null;
              return (
                <ListingMapMarker
                  key={entry.listing.id}
                  listing={entry.listing}
                  coordinates={item.coordinates}
                  isDesktopViewport={isDesktopViewport}
                  isCarouselVisible={isCarouselVisible}
                  mobileCarouselListingId={mobileCarouselListingId}
                  selectedListingId={selectedListingId}
                  hoveredListingId={hoveredListingId}
                  previewListingId={previewListingId}
                  savedListingIdSet={savedListingIdSet}
                  visitedListingIdSet={visitedListingIdSet}
                  handleMarkerClick={handleMarkerClick}
                />
              );
            })
          : orderedListings.map(({ listing, markerCoordinates }) =>
              <ListingMapMarker
                key={listing.id}
                listing={listing}
                coordinates={markerCoordinates}
                isDesktopViewport={isDesktopViewport}
                isCarouselVisible={isCarouselVisible}
                mobileCarouselListingId={mobileCarouselListingId}
                selectedListingId={selectedListingId}
                hoveredListingId={hoveredListingId}
                previewListingId={previewListingId}
                savedListingIdSet={savedListingIdSet}
                visitedListingIdSet={visitedListingIdSet}
                handleMarkerClick={handleMarkerClick}
              />
            ))}
      {showListings && useClusteredListingLayers && overlayListings.map(({ listing, markerCoordinates }) => (
        <ListingMapMarker
          key={`overlay-${listing.id}`}
          listing={listing}
          coordinates={markerCoordinates}
          isDesktopViewport={isDesktopViewport}
          isCarouselVisible={isCarouselVisible}
          mobileCarouselListingId={mobileCarouselListingId}
          selectedListingId={selectedListingId}
          hoveredListingId={hoveredListingId}
          previewListingId={previewListingId}
          savedListingIdSet={savedListingIdSet}
          visitedListingIdSet={visitedListingIdSet}
          handleMarkerClick={handleMarkerClick}
        />
      ))}
      </Map>
      <AnimatePresence>
        {showListings && desktopPreviewListing && desktopPreviewStyle && !isCarouselVisible && (
          <motion.div
            key={desktopPreviewListing.id}
            style={desktopPreviewStyle}
            className="pointer-events-auto absolute hidden w-72 lg:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <ListingCard listing={desktopPreviewListing} variant="carousel" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const LISTING_CLUSTER_LAYER = {
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

const LISTING_CLUSTER_COUNT_LAYER = {
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

const LISTING_UNCLUSTERED_CIRCLE_LAYER = {
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

const LISTING_UNCLUSTERED_LABEL_LAYER = {
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

type ClusterRenderItem =
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

interface ListingMarkerRenderContext {
  isDesktopViewport: boolean;
  isCarouselVisible: boolean;
  mobileCarouselListingId: string | null;
  selectedListingId: string | null;
  hoveredListingId: string | null;
  previewListingId: string | null;
  savedListingIdSet: Set<string>;
  visitedListingIdSet: Set<string>;
  handleMarkerClick: (listingId: string) => void;
}

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

type ClusteredListingProperties = {
  listingId: string;
  price: number;
  priceLabel: string;
};

function buildClusteredListingFeatureCollection(
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

function getClusterFeature(features?: GeoJSONFeature[] | null) {
  return (features ?? []).find((feature) => feature.layer?.id === CLUSTER_LAYER_ID) as
    | GeoJSONFeature
    | undefined;
}

function getListingFeature(features?: GeoJSONFeature[] | null) {
  return (features ?? []).find((feature) => {
    const layerId = feature.layer?.id;
    return layerId === UNCLUSTERED_CIRCLE_LAYER_ID || layerId === UNCLUSTERED_LABEL_LAYER_ID;
  }) as GeoJSONFeature | undefined;
}

function getClusterIdFromFeature(feature: GeoJSONFeature) {
  const clusterId = feature.properties?.cluster_id;
  if (typeof clusterId === 'number') return clusterId;
  if (typeof clusterId === 'string') return Number(clusterId);
  return null;
}

function getClusterCountFromFeature(feature: GeoJSONFeature) {
  const count = feature.properties?.point_count;
  if (typeof count === 'number') return count;
  if (typeof count === 'string') return Number(count);
  return null;
}

function getListingIdFromFeature(feature: GeoJSONFeature) {
  const listingId = feature.properties?.listingId;
  return typeof listingId === 'string' ? listingId : null;
}

function ListingMapMarker({
  listing,
  coordinates,
  ...context
}: { listing: Listing; coordinates: { lat: number; lng: number } } & ListingMarkerRenderContext) {
  const isActiveMobilePin =
    !context.isDesktopViewport &&
    context.isCarouselVisible &&
    listing.id === context.mobileCarouselListingId;
  const isSelected = context.isDesktopViewport
    ? listing.id === context.selectedListingId || listing.id === context.previewListingId
    : isActiveMobilePin;
  const isHighlighted = context.isDesktopViewport && listing.id === context.hoveredListingId;
  const isSaved = context.savedListingIdSet.has(listing.id);
  const isVisited = context.visitedListingIdSet.has(listing.id);
  const minimized = shouldMinimizeListingPin(listing.id) && !isSelected && !isHighlighted;

  return (
    <Marker
      longitude={coordinates.lng}
      latitude={coordinates.lat}
      anchor="bottom"
    >
      <div>
        <PriceMarker
          price={listing.price}
          isSelected={isSelected}
          isHighlighted={isHighlighted}
          isSaved={isSaved}
          isVisited={isVisited}
          minimized={minimized}
          onClick={() => context.handleMarkerClick(listing.id)}
        />
      </div>
    </Marker>
  );
}

function shouldMinimizeListingPin(listingId: string) {
  return hashStringToBucket(listingId) % 2 === 0;
}

function hashStringToBucket(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getSpreadListingCoordinates(listing: Listing, index: number) {
  const offset = LISTING_MARKER_OFFSETS[index % LISTING_MARKER_OFFSETS.length];
  return {
    lat: listing.coordinates.lat + offset.lat,
    lng: listing.coordinates.lng + offset.lng,
  };
}

function getDesktopHoverCardStyle(
  map: MapRef | null,
  coordinates: { lat: number; lng: number }
): { left: number; top: number } | null {
  if (!map) return null;
  const container = map.getContainer();
  const { clientWidth, clientHeight } = container;
  if (!clientWidth || !clientHeight) return null;

  const point = map.project([coordinates.lng, coordinates.lat]);
  const prefersRight = point.x < clientWidth / 2;
  const prefersBelow = point.y < clientHeight / 2;

  const unclampedLeft = prefersRight
    ? point.x + HOVER_CARD_SIDE_GAP
    : point.x - HOVER_CARD_WIDTH - HOVER_CARD_SIDE_GAP;
  const unclampedTop = prefersBelow
    ? point.y - HOVER_CARD_PIN_TOP_OFFSET
    : point.y - HOVER_CARD_HEIGHT + HOVER_CARD_PIN_TOP_OFFSET;

  const left = clamp(unclampedLeft, HOVER_CARD_EDGE_PADDING, clientWidth - HOVER_CARD_WIDTH - HOVER_CARD_EDGE_PADDING);
  const top = clamp(unclampedTop, HOVER_CARD_EDGE_PADDING, clientHeight - HOVER_CARD_HEIGHT - HOVER_CARD_EDGE_PADDING);

  return { left, top };
}


function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
