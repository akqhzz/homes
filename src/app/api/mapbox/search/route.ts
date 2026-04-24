import { MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
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
    .filter(Boolean);

  return Response.json({ results });
}
