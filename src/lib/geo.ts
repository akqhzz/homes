import { Coordinates, Listing, Location, Neighborhood } from '@/lib/types';

export type BoundingBox = [number, number, number, number];

const EARTH_RADIUS_KM = 6371;

export function closePolygon(points: Coordinates[]) {
  if (points.length === 0) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (first.lat === last.lat && first.lng === last.lng) return points;
  return [...points, first];
}

export function pointInPolygon(point: Coordinates, polygon: Coordinates[]) {
  const closed = closePolygon(polygon);
  if (closed.length < 4) return false;

  let inside = false;
  for (let i = 0, j = closed.length - 1; i < closed.length; j = i++) {
    const xi = closed[i].lng;
    const yi = closed[i].lat;
    const xj = closed[j].lng;
    const yj = closed[j].lat;

    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

export function pointInBoundingBox(point: Coordinates, bbox: BoundingBox) {
  const [west, south, east, north] = bbox;
  return point.lng >= west && point.lng <= east && point.lat >= south && point.lat <= north;
}

export function getBoundsFromPoints(points: Coordinates[]): BoundingBox | null {
  if (points.length === 0) return null;

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

export function mergeBounds(bounds: Array<BoundingBox | null | undefined>): BoundingBox | null {
  const valid = bounds.filter((bound): bound is BoundingBox => Array.isArray(bound));
  if (valid.length === 0) return null;

  return [
    Math.min(...valid.map((bound) => bound[0])),
    Math.min(...valid.map((bound) => bound[1])),
    Math.max(...valid.map((bound) => bound[2])),
    Math.max(...valid.map((bound) => bound[3])),
  ];
}

export function getNeighborhoodBounds(neighborhood: Neighborhood) {
  return getBoundsFromPoints(neighborhood.boundary ?? [neighborhood.coordinates]);
}

export function getBoundsCenter(bounds: BoundingBox) {
  const [west, south, east, north] = bounds;
  return {
    lng: (west + east) / 2,
    lat: (south + north) / 2,
  };
}

export function getSuggestedZoom(bounds: BoundingBox) {
  const lngDelta = Math.abs(bounds[2] - bounds[0]);
  const latDelta = Math.abs(bounds[3] - bounds[1]);
  const maxDelta = Math.max(lngDelta, latDelta * 1.35);

  if (maxDelta <= 0.008) return 15.2;
  if (maxDelta <= 0.015) return 14.4;
  if (maxDelta <= 0.03) return 13.6;
  if (maxDelta <= 0.06) return 12.8;
  if (maxDelta <= 0.12) return 11.8;
  if (maxDelta <= 0.24) return 10.8;
  return 9.8;
}

export function getLocationBounds(location: Location): BoundingBox {
  if (location.bbox) return location.bbox;

  const radiusByType: Record<Location['type'], number> = {
    neighborhood: 0.012,
    area: 0.028,
    city: 0.06,
  };
  const radius = radiusByType[location.type];

  return [
    location.coordinates.lng - radius,
    location.coordinates.lat - radius,
    location.coordinates.lng + radius,
    location.coordinates.lat + radius,
  ];
}

function haversineDistanceKm(a: Coordinates, b: Coordinates) {
  const latDelta = toRadians(b.lat - a.lat);
  const lngDelta = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(latDelta / 2);
  const sinLng = Math.sin(lngDelta / 2);
  const value =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function listingMatchesLocation(listing: Listing, location: Location) {
  if (location.bbox && pointInBoundingBox(listing.coordinates, location.bbox)) return true;

  const radiusKmByType: Record<Location['type'], number> = {
    neighborhood: 1.8,
    area: 4.5,
    city: 18,
  };

  return haversineDistanceKm(listing.coordinates, location.coordinates) <= radiusKmByType[location.type];
}
