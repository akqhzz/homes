'use client';
import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react';
import type { FeatureCollection, Point } from 'geojson';
import type { GeoJSONSource, MapLayerMouseEvent } from 'mapbox-gl';
import type { MapRef } from 'react-map-gl/mapbox';
import {
  CLUSTER_LAYER_ID,
  CLUSTER_SOURCE_ID,
  UNCLUSTERED_CIRCLE_LAYER_ID,
  getClusterCountFromFeature,
  getClusterFeature,
  getClusterIdFromFeature,
  getListingFeature,
  getListingIdFromFeature,
  type ClusterRenderItem,
  type ListingMarkerEntry,
} from '@/lib/map/rendering';

interface UseListingClusterLayerParams {
  clusteredListingData: FeatureCollection<Point>;
  hoveredListingId: string | null;
  isDesktopViewport: boolean;
  listingIndexById: Map<string, ListingMarkerEntry>;
  mapLoaded: boolean;
  mapRef: RefObject<MapRef | null>;
  onListingLayerClick: (listingId: string) => void;
  overlayListingIdSet: Set<string>;
  showListings: boolean;
  useClusteredListingLayers: boolean;
  viewState: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
}

export default function useListingClusterLayer({
  clusteredListingData,
  hoveredListingId,
  isDesktopViewport,
  listingIndexById,
  mapLoaded,
  mapRef,
  onListingLayerClick,
  overlayListingIdSet,
  showListings,
  useClusteredListingLayers,
  viewState,
}: UseListingClusterLayerParams) {
  const [clusterRenderItems, setClusterRenderItems] = useState<ClusterRenderItem[]>([]);

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
  }, [mapRef]);

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
  }, [mapLoaded, mapRef, useClusteredListingLayers]);

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
    mapRef,
    showListings,
    useClusteredListingLayers,
  ]);

  const handleListingLayerPointer = useCallback((event: MapLayerMouseEvent) => {
    if (!showListings || !useClusteredListingLayers) return false;

    const clusterFeature = getClusterFeature(event.features);
    if (clusterFeature) {
      const clusterId = getClusterIdFromFeature(clusterFeature);
      const geometry = clusterFeature.geometry;
      if (clusterId != null && geometry.type === 'Point') {
        handleClusterExpand(clusterId, [geometry.coordinates[0], geometry.coordinates[1]]);
        return true;
      }
    }

    const listingFeature = getListingFeature(event.features);
    const listingId = listingFeature ? getListingIdFromFeature(listingFeature) : null;
    if (listingId) {
      onListingLayerClick(listingId);
      return true;
    }

    return false;
  }, [handleClusterExpand, onListingLayerClick, showListings, useClusteredListingLayers]);

  useEffect(() => {
    const map = mapRef.current;
    return () => {
      const canvas = map?.getMap().getCanvas();
      if (canvas) canvas.style.cursor = '';
    };
  }, [mapRef]);

  useEffect(() => {
    if (useClusteredListingLayers) return;
    const canvas = mapRef.current?.getMap().getCanvas();
    if (canvas) canvas.style.cursor = '';
  }, [mapRef, useClusteredListingLayers]);

  useEffect(() => {
    if (!useClusteredListingLayers) return;

    const frame = requestAnimationFrame(refreshClusterRenderItems);
    return () => cancelAnimationFrame(frame);
  }, [
    clusteredListingData,
    refreshClusterRenderItems,
    useClusteredListingLayers,
    viewState.latitude,
    viewState.longitude,
    viewState.zoom,
  ]);

  return {
    clusterRenderItems,
    handleClusterExpand,
    handleListingLayerPointer,
    handleSourceLayerHover,
    highlightedClusterId,
    refreshClusterRenderItems,
  };
}
