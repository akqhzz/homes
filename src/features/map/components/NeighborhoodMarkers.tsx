'use client';
import { type RefObject } from 'react';
import { Marker, type MapRef } from 'react-map-gl/mapbox';
import type { Neighborhood } from '@/lib/types';
import {
  getCombinedNeighborhoodBounds,
  getNeighborhoodBoundsForMap,
  type NeighborhoodDisplayItem,
} from '@/lib/map/rendering';
import NeighborhoodPin from '@/features/map/components/NeighborhoodPin';

interface NeighborhoodMarkersProps {
  includedNeighborhoodIds?: Set<string>;
  isAreaMode: boolean;
  mapRef: RefObject<MapRef | null>;
  neighborhoodDisplayItems: NeighborhoodDisplayItem[];
  onNeighborhoodClick?: (neighborhood: Neighborhood) => void;
  onNeighborhoodHover?: (neighborhood: Neighborhood | null) => void;
  selectedNeighborhoodId?: string | null;
  showNeighborhoods: boolean;
}

export default function NeighborhoodMarkers({
  includedNeighborhoodIds,
  isAreaMode,
  mapRef,
  neighborhoodDisplayItems,
  onNeighborhoodClick,
  onNeighborhoodHover,
  selectedNeighborhoodId,
  showNeighborhoods,
}: NeighborhoodMarkersProps) {
  if (!showNeighborhoods) return null;

  return (
    <>
      {neighborhoodDisplayItems.map((item) => (
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
    </>
  );
}
