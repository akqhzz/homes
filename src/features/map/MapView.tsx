'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MapLayerMouseEvent } from 'mapbox-gl';
import Map, { type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Listing, Location, Neighborhood } from '@/lib/types';
import { getMapboxToken } from '@/lib/mapbox';
import ListingCard from '@/features/listings/components/ListingCard';
import BoundaryLayers from '@/features/map/components/BoundaryLayers';
import ListingMarkers from '@/features/map/components/ListingMarkers';
import NeighborhoodMarkers from '@/features/map/components/NeighborhoodMarkers';
import useListingClusterLayer from '@/features/map/hooks/useListingClusterLayer';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import { useSavedStore } from '@/store/savedStore';
import {
  CLUSTER_TRANSITION_ZOOM,
  buildClusteredListingFeatureCollection,
  buildNeighborhoodDisplayItems,
  getDesktopHoverCardStyle,
  getRenderNeighborhoods,
  getSpreadListingCoordinates,
  type ListingMarkerEntry,
  type NeighborhoodDisplayItem,
} from '@/lib/map/rendering';

const MAPBOX_TOKEN = getMapboxToken();

const HOVER_CARD_WIDTH = 288;
const HOVER_CARD_HEIGHT = 252;
const HOVER_CARD_EDGE_PADDING = 16;
const HOVER_CARD_SIDE_GAP = 24;
const HOVER_CARD_PIN_TOP_OFFSET = 20;

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
  drawnBoundaries?: { lat: number; lng: number }[][];
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
  drawnBoundaries,
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
  const likedListingIds = useSavedStore((s) => s.likedListingIds);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapRef | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<MapRef | null>(null);
  const [neighborhoodDisplayItems, setNeighborhoodDisplayItems] = useState<NeighborhoodDisplayItem[]>([]);
  const [previewListingId, setPreviewListingId] = useState<string | null>(null);

  const mapStyle = isSatelliteMode
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : 'mapbox://styles/mapbox/standard';
  const isDesktopViewport = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const visibleDrawnBoundaries = drawnBoundaries ?? (drawnBoundary.length > 0 ? [drawnBoundary] : []);

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

  useEffect(() => {
    if (!mapLoaded || !containerRef.current || typeof ResizeObserver === 'undefined') return;
    const resizeMap = () => mapRef.current?.resize();
    let frame: number | null = null;
    const observer = new ResizeObserver(() => {
      resizeMap();
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(resizeMap);
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mapLoaded]);

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
    () => new globalThis.Map<string, ListingMarkerEntry>(indexedListings.map((entry) => [entry.listing.id, entry])),
    [indexedListings]
  );
  const visitedListingIdSet = useMemo(() => new Set(visitedListingIds), [visitedListingIds]);
  const savedListingIdSet = useMemo(
    () => new Set(listings.filter((listing) => likedListingIds.has(listing.id)).map((listing) => listing.id)),
    [likedListingIds, listings]
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
    return getDesktopHoverCardStyle({
      map: mapInstance,
      coordinates: previewEntry.markerCoordinates,
      width: HOVER_CARD_WIDTH,
      height: HOVER_CARD_HEIGHT,
      edgePadding: HOVER_CARD_EDGE_PADDING,
      sideGap: HOVER_CARD_SIDE_GAP,
      pinTopOffset: HOVER_CARD_PIN_TOP_OFFSET,
    });
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
  const {
    clusterRenderItems,
    handleClusterExpand,
    handleListingLayerPointer,
    handleSourceLayerHover,
    highlightedClusterId,
    refreshClusterRenderItems,
  } = useListingClusterLayer({
    clusteredListingData,
    hoveredListingId,
    isDesktopViewport,
    listingIndexById,
    mapLoaded,
    mapRef,
    onListingLayerClick: handleMarkerClick,
    overlayListingIdSet,
    showListings,
    useClusteredListingLayers,
    viewState,
  });

  const handleMapPointer = useCallback((event: MapLayerMouseEvent) => {
    if (showListings) {
      if (handleListingLayerPointer(event)) return;
      handleMapClick();
      return;
    }

    onAreaMapClick?.({ lat: event.lngLat.lat, lng: event.lngLat.lng });
  }, [handleListingLayerPointer, handleMapClick, onAreaMapClick, showListings]);

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
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
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
      <BoundaryLayers
        boundaryNeighborhoods={boundaryNeighborhoods}
        includedNeighborhoodIds={includedNeighborhoodIds}
        previewNeighborhoodId={previewNeighborhoodId}
        searchedLocations={searchedLocations}
        showAmenities={showAmenities}
        visibleDrawnBoundaries={visibleDrawnBoundaries}
      />

      <NeighborhoodMarkers
        includedNeighborhoodIds={includedNeighborhoodIds}
        isAreaMode={isAreaMode}
        mapRef={mapRef}
        neighborhoodDisplayItems={neighborhoodDisplayItems}
        onNeighborhoodClick={onNeighborhoodClick}
        onNeighborhoodHover={onNeighborhoodHover}
        selectedNeighborhoodId={selectedNeighborhoodId}
        showNeighborhoods={showNeighborhoods}
      />

      <ListingMarkers
        clusteredListingData={clusteredListingData}
        clusterRenderItems={clusterRenderItems}
        highlightedClusterId={highlightedClusterId}
        isCarouselVisible={isCarouselVisible}
        isDesktopViewport={isDesktopViewport}
        listingIndexById={listingIndexById}
        mobileCarouselListingId={mobileCarouselListingId}
        onClusterExpand={handleClusterExpand}
        onMarkerClick={handleMarkerClick}
        orderedListings={orderedListings}
        overlayListings={overlayListings}
        previewListingId={previewListingId}
        savedListingIdSet={savedListingIdSet}
        selectedListingId={selectedListingId}
        hoveredListingId={hoveredListingId}
        shouldUseClusterDataSource={shouldUseClusterDataSource}
        showListings={showListings}
        useClusteredListingLayers={useClusteredListingLayers}
        visitedListingIdSet={visitedListingIdSet}
      />
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
