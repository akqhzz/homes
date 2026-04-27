export function getMapboxToken() {
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_ACCESS_TOKEN ?? '';
}
