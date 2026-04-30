'use client';
import type { FeatureCollection, Point } from 'geojson';
import { Layer, Marker, Source } from 'react-map-gl/mapbox';
import PriceMarker from '@/features/map/components/PriceMarker';
import MapClusterMarker from '@/features/map/components/MapClusterMarker';
import type { Listing } from '@/lib/types';
import {
  CLUSTER_SOURCE_ID,
  LISTING_CLUSTER_COUNT_LAYER,
  LISTING_CLUSTER_LAYER,
  LISTING_UNCLUSTERED_CIRCLE_LAYER,
  LISTING_UNCLUSTERED_LABEL_LAYER,
  shouldMinimizeListingPin,
  type ClusterRenderItem,
} from '@/lib/map/rendering';

type ListingMarkerEntry = {
  listing: Listing;
  markerCoordinates: { lat: number; lng: number };
};

interface ListingMarkersProps {
  clusteredListingData: FeatureCollection<Point>;
  clusterRenderItems: ClusterRenderItem[];
  highlightedClusterId: number | null;
  isCarouselVisible: boolean;
  isDesktopViewport: boolean;
  listingIndexById: Map<string, ListingMarkerEntry>;
  mobileCarouselListingId: string | null;
  onClusterExpand: (clusterId: number, coordinates: [number, number]) => void;
  onMarkerClick: (listingId: string) => void;
  orderedListings: ListingMarkerEntry[];
  overlayListings: ListingMarkerEntry[];
  previewListingId: string | null;
  savedListingIdSet: Set<string>;
  selectedListingId: string | null;
  hoveredListingId: string | null;
  shouldUseClusterDataSource: boolean;
  showListings: boolean;
  useClusteredListingLayers: boolean;
  visitedListingIdSet: Set<string>;
}

export default function ListingMarkers({
  clusteredListingData,
  clusterRenderItems,
  highlightedClusterId,
  isCarouselVisible,
  isDesktopViewport,
  listingIndexById,
  mobileCarouselListingId,
  onClusterExpand,
  onMarkerClick,
  orderedListings,
  overlayListings,
  previewListingId,
  savedListingIdSet,
  selectedListingId,
  hoveredListingId,
  shouldUseClusterDataSource,
  showListings,
  useClusteredListingLayers,
  visitedListingIdSet,
}: ListingMarkersProps) {
  if (!showListings) return null;

  return (
    <>
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

      {useClusteredListingLayers
        ? clusterRenderItems.map((item) => {
            if (item.type === 'cluster') {
              return (
                <Marker
                  key={item.id}
                  longitude={item.coordinates.lng}
                  latitude={item.coordinates.lat}
                  anchor="center"
                >
                  <MapClusterMarker
                    count={item.count}
                    highlighted={item.clusterId === highlightedClusterId}
                    onClick={() => onClusterExpand(item.clusterId, [item.coordinates.lng, item.coordinates.lat])}
                    aria-label={`Expand ${item.count} listings`}
                  />
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
                onMarkerClick={onMarkerClick}
              />
            );
          })
        : orderedListings.map(({ listing, markerCoordinates }) => (
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
              onMarkerClick={onMarkerClick}
            />
          ))}

      {useClusteredListingLayers && overlayListings.map(({ listing, markerCoordinates }) => (
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
          onMarkerClick={onMarkerClick}
        />
      ))}
    </>
  );
}

interface ListingMarkerRenderContext {
  isDesktopViewport: boolean;
  isCarouselVisible: boolean;
  mobileCarouselListingId: string | null;
  selectedListingId: string | null;
  hoveredListingId: string | null;
  previewListingId: string | null;
  savedListingIdSet: Set<string>;
  visitedListingIdSet: Set<string>;
  onMarkerClick: (listingId: string) => void;
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
          onClick={() => context.onMarkerClick(listing.id)}
        />
      </div>
    </Marker>
  );
}
