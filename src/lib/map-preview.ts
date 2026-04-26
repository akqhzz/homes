import { Coordinates } from '@/lib/types';

interface StaticMapPreviewOptions {
  width?: number;
  height?: number;
  zoom?: number;
}

export function getStaticMapPreviewUrl(
  coordinates: Coordinates,
  mapboxToken: string | null | undefined,
  options: StaticMapPreviewOptions = {}
) {
  if (!mapboxToken) return null;

  const {
    width = 192,
    height = 192,
    zoom = 11.6,
  } = options;

  const { lng, lat } = coordinates;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${lng},${lat},${zoom},0/${width}x${height}@2x?access_token=${mapboxToken}`;
}
