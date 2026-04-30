'use client';
import { Layer, Marker, Source } from 'react-map-gl/mapbox';
import type { Coordinates, Location, Neighborhood } from '@/lib/types';
import {
  AMENITY_POINTS,
  getDrawnBoundaryFeature,
  getLocationBoundaryFeature,
  getNeighborhoodBoundaryFeature,
} from '@/lib/map/rendering';

const BRAND_300 = '#92c3b2';
const BRAND_400 = '#61a08b';
const BRAND_700 = '#255b53';

const ACTIVE_BOUNDARY_STYLE = {
  lineColor: BRAND_700,
  lineOpacity: 0.96,
  lineWidth: 1.2,
  lineDasharray: [1, 0],
  fillColor: BRAND_400,
  fillOpacity: 0.03,
};

const PREVIEW_BOUNDARY_STYLE = {
  lineColor: BRAND_300,
  lineOpacity: 0.78,
  lineWidth: 1.2,
  lineDasharray: [2, 2],
  fillColor: ACTIVE_BOUNDARY_STYLE.fillColor,
  fillOpacity: ACTIVE_BOUNDARY_STYLE.fillOpacity,
};

interface BoundaryLayersProps {
  boundaryNeighborhoods: Neighborhood[];
  includedNeighborhoodIds?: Set<string>;
  previewNeighborhoodId?: string | null;
  searchedLocations: Location[];
  showAmenities: boolean;
  visibleDrawnBoundaries: Coordinates[][];
}

function getBoundaryPaintState(
  neighborhoodId: string,
  includedNeighborhoodIds?: Set<string>,
  previewNeighborhoodId?: string | null
) {
  const isPreview = previewNeighborhoodId === neighborhoodId && !includedNeighborhoodIds?.has(neighborhoodId);
  return isPreview ? PREVIEW_BOUNDARY_STYLE : ACTIVE_BOUNDARY_STYLE;
}

export default function BoundaryLayers({
  boundaryNeighborhoods,
  includedNeighborhoodIds,
  previewNeighborhoodId,
  searchedLocations,
  showAmenities,
  visibleDrawnBoundaries,
}: BoundaryLayersProps) {
  return (
    <>
      {boundaryNeighborhoods.map((neighborhood) => {
        const paintState = getBoundaryPaintState(
          neighborhood.id,
          includedNeighborhoodIds,
          previewNeighborhoodId
        );

        return (
          <Source
            key={neighborhood.id}
            id={`neighborhood-boundary-${neighborhood.id}`}
            type="geojson"
            data={getNeighborhoodBoundaryFeature(neighborhood)}
          >
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

      {visibleDrawnBoundaries.map((boundary, boundaryIndex) => boundary.length > 1 && (
        <Source
          key={`drawn-search-boundary-${boundaryIndex}`}
          id={`drawn-search-boundary-${boundaryIndex}`}
          type="geojson"
          data={getDrawnBoundaryFeature(boundary)}
        >
          <Layer
            id={`drawn-search-boundary-line-${boundaryIndex}`}
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
          {boundary.length > 2 && (
            <Layer
              id={`drawn-search-boundary-fill-${boundaryIndex}`}
              type="fill"
              paint={{
                'fill-color': ACTIVE_BOUNDARY_STYLE.fillColor,
                'fill-opacity': ACTIVE_BOUNDARY_STYLE.fillOpacity,
                'fill-emissive-strength': 0.22,
              }}
            />
          )}
        </Source>
      ))}

      {visibleDrawnBoundaries.flatMap((boundary, boundaryIndex) => boundary.map((point, pointIndex) => (
        <Marker
          key={`draw-point-${boundaryIndex}-${point.lat}-${point.lng}-${pointIndex}`}
          longitude={point.lng}
          latitude={point.lat}
          anchor="center"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-[#255b53] shadow-[0_1px_2px_rgba(15,23,41,0.24)]" />
        </Marker>
      )))}

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
    </>
  );
}
