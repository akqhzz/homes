import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { closePolygon } from '@/lib/geo';
import { normalizeMapboxFeature } from '@/lib/mapbox';
import { getMapboxToken } from '@/lib/mapbox-token';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  if (!query) {
    return Response.json({
      results: MOCK_NEIGHBORHOODS.slice(0, 8).map((neighborhood) => ({
        id: neighborhood.id,
        name: neighborhood.name,
        type: 'neighborhood' as const,
        coordinates: neighborhood.coordinates,
        city: neighborhood.city,
        province: 'ON',
        boundary: closePolygon(neighborhood.boundary ?? []),
      })),
    });
  }

  const token = getMapboxToken();

  const params = new URLSearchParams({
    access_token: token,
    autocomplete: 'true',
    limit: '8',
    language: 'en',
    country: 'ca',
    proximity: '-79.3832,43.6532',
    types: 'place,locality,neighborhood,district,address,postcode',
  });

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    return Response.json({ results: [] }, { status: response.status });
  }

  const payload = (await response.json()) as { features?: unknown[] };
  const results = (payload.features ?? [])
    .map((feature) => normalizeMapboxFeature(feature as never))
    .map((location) => enrichLocationBoundary(location))
    .filter(Boolean);

  return Response.json({ results });
}

function enrichLocationBoundary(location: ReturnType<typeof normalizeMapboxFeature>) {
  if (!location) return null;

  const normalizedLocation = normalizeBoundaryName(location.name);
  const matchedNeighborhood = MOCK_NEIGHBORHOODS.find((neighborhood) =>
    getNeighborhoodAliases(neighborhood.id).some((alias) => normalizeBoundaryName(alias) === normalizedLocation)
  );

  if (matchedNeighborhood?.boundary) {
    return {
      ...location,
      type: 'neighborhood' as const,
      boundary: closePolygon(matchedNeighborhood.boundary),
    };
  }

  return location;
}

function normalizeBoundaryName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getNeighborhoodAliases(neighborhoodId: string) {
  const aliases: Record<string, string[]> = {
    'nbh-annex': ['Annex'],
    'nbh-yorkville': ['Yorkville', 'YorkVille', 'Bay-Cloverhill'],
    'nbh-kensington': ['Kensington', 'Kensington Market', 'Kensington-Chinatown'],
    'nbh-church-st': ['Church St Corridor', 'Church Street', 'Church-Wellesley', 'Church Wellesley'],
    'nbh-cabbagetown': ['Cabbagetown', 'Cabbagetown-South St.James Town', 'Cabbagetown South St James Town'],
    'nbh-queen-west': ['Queen West', 'West Queen West'],
    'nbh-king-west': ['King West', 'Wellington Place'],
    'nbh-grange-park': ['Grange Park', 'Discovery District', 'University'],
  };

  return aliases[neighborhoodId] ?? [];
}
