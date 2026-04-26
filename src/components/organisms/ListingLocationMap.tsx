'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import MapGL, { AttributionControl, Marker } from 'react-map-gl/mapbox';
import { Listing } from '@/lib/types';
import { getMapboxToken } from '@/lib/mapbox-token';
import { getStaticMapPreviewUrl } from '@/lib/map-preview';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import MapListingPin from '@/components/atoms/MapListingPin';
import OverlayCloseButton from '@/components/atoms/OverlayCloseButton';

const MAPBOX_TOKEN = getMapboxToken();

export default function ListingLocationMap({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 1024));
  const previewSrc = useMemo(
    () => getStaticMapPreviewUrl(listing.coordinates, MAPBOX_TOKEN, { width: 320, height: 200, zoom: 12.4 }),
    [listing.coordinates]
  );
  const overlayStyle = { backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 20%, transparent)' };
  const previewWashStyle = { backgroundColor: 'color-mix(in srgb, var(--color-surface-elevated) 15%, transparent)' };

  useEffect(() => {
    const updateViewport = () => setIsDesktop(window.innerWidth >= 1024);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block h-28 w-full overflow-hidden rounded-[24px] bg-[var(--color-surface)] shadow-[var(--shadow-control)] transition-transform hover:scale-[1.01]"
      >
        {previewSrc ? (
          <>
            <Image src={previewSrc} alt="" fill sizes="(min-width: 1024px) 248px, 100vw" className="object-cover" draggable={false} unoptimized />
            <div className="pointer-events-none absolute inset-0" style={previewWashStyle} />
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[78%]">
              <MapListingPin size={22} dotSize={6} />
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-[var(--color-surface)]">
            <MapPin size={24} className="text-[var(--color-text-tertiary)]" />
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          isDesktop ? (
            <>
              <motion.button
                type="button"
                aria-label="Close map preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90]"
                style={overlayStyle}
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.98 }}
                transition={{ type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="fixed left-1/2 top-1/2 z-[100] flex h-[72vh] w-[min(880px,calc(100vw-3rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[32px] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-xl)]"
              >
                <div className="flex items-start justify-between gap-4 border-b border-[var(--color-surface)] px-6 py-5">
                  <div className="min-w-0">
                    <p className="type-subtitle text-[var(--color-text-primary)]">{listing.neighborhood}</p>
                    <p className="mt-1 type-body text-[var(--color-text-secondary)]">
                      {listing.address}, {listing.city}, {listing.province}
                    </p>
                  </div>
                  <OverlayCloseButton onClick={() => setOpen(false)} label="Close interactive map" variant="glass" />
                </div>
                <div className="min-h-0 flex-1 p-4">
                  <ListingLocationMapCanvas listing={listing} />
                </div>
              </motion.div>
            </>
          ) : (
            <MobileDrawer
              title={listing.address}
              onClose={() => setOpen(false)}
              heightClassName="h-[70dvh]"
              contentClassName="flex flex-1 flex-col px-4 pb-4 pt-0"
            >
              <ListingLocationMapCanvas listing={listing} />
            </MobileDrawer>
          )
        )}
      </AnimatePresence>
    </>
  );
}

function ListingLocationMapCanvas({ listing }: { listing: Listing }) {
  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full items-center justify-center rounded-[24px] bg-[var(--color-surface)]">
        <div className="p-6 text-center">
          <MapPin size={32} className="mx-auto text-[var(--color-text-tertiary)]" />
          <p className="mt-3 type-heading-sm text-[var(--color-text-primary)]">{listing.neighborhood}</p>
          <p className="mt-1 type-body text-[var(--color-text-secondary)]">{listing.address}</p>
          <p className="mt-1 type-caption text-[var(--color-text-tertiary)]">
            {listing.coordinates.lat.toFixed(4)}, {listing.coordinates.lng.toFixed(4)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-[24px]">
      <MapGL
        initialViewState={{
          longitude: listing.coordinates.lng,
          latitude: listing.coordinates.lat,
          zoom: 13.4,
        }}
        mapStyle="mapbox://styles/mapbox/standard"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
        config={{
          basemap: {
            theme: 'faded',
            lightPreset: 'day',
            show3dObjects: false,
          },
        }}
      >
        <Marker longitude={listing.coordinates.lng} latitude={listing.coordinates.lat} anchor="bottom">
          <MapListingPin size={22} dotSize={6} />
        </Marker>
        <AttributionControl compact position="bottom-right" />
      </MapGL>
    </div>
  );
}
