import { normalizeMapboxFeature } from '@/lib/mapbox';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  if (!query) return Response.json({ results: [] });

  const token = process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    return Response.json({ results: [] }, { status: 503 });
  }

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
