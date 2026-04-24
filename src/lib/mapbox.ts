import { Location } from '@/lib/types';

interface MapboxContext {
  id?: string;
  text?: string;
  short_code?: string;
}

interface MapboxFeature {
  id: string;
  text?: string;
  place_name?: string;
  center?: [number, number];
  place_type?: string[];
  bbox?: [number, number, number, number];
  context?: MapboxContext[];
}

export function normalizeMapboxFeature(feature: MapboxFeature): Location | null {
  if (!feature.center || feature.center.length < 2) return null;

  const name = feature.place_name ?? feature.text;
  if (!name) return null;

  const type = getLocationType(feature.place_type ?? []);
  const city =
    getContextText(feature.context, 'place') ??
    getContextText(feature.context, 'locality') ??
    (type === 'city' ? feature.text : undefined);
  const province = getProvinceCode(feature.context);

  return {
    id: feature.id,
    name,
    type,
    coordinates: {
      lng: feature.center[0],
      lat: feature.center[1],
    },
    city,
    province,
    bbox: feature.bbox,
  };
}

function getLocationType(placeTypes: string[]): Location['type'] {
  if (placeTypes.includes('neighborhood')) return 'neighborhood';
  if (placeTypes.includes('place') || placeTypes.includes('locality')) return 'city';
  return 'area';
}

function getContextText(context: MapboxContext[] | undefined, prefix: string) {
  return context?.find((item) => item.id?.startsWith(`${prefix}.`))?.text;
}

function getProvinceCode(context: MapboxContext[] | undefined) {
  return context
    ?.find((item) => item.id?.startsWith('region.'))
    ?.short_code
    ?.split('-')
    ?.at(1);
}
