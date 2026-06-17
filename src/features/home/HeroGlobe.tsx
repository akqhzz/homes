'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type City = { name: string; lat: number; lng: number };
type Province = { code: string; name: string; lat: number; lng: number; image: string; cities: City[] };
type Cluster = { code: string; label: string; lat: number; lng: number; members: string[] };

// Major Canadian provinces with a few headline cities each.
const PROVINCES: Province[] = [
  {
    code: 'BC', name: 'British Columbia', lat: 53.5, lng: -125, image: 'https://images.unsplash.com/photo-1560814304-4f05b62af116?w=160&q=80',
    cities: [
      { name: 'Vancouver', lat: 49.28, lng: -123.12 },
      { name: 'Victoria', lat: 48.43, lng: -123.37 },
      { name: 'Kelowna', lat: 49.89, lng: -119.5 },
      { name: 'Surrey', lat: 49.19, lng: -122.85 },
    ],
  },
  {
    code: 'AB', name: 'Alberta', lat: 54.5, lng: -114.5, image: 'https://images.unsplash.com/photo-1609825488888-3a766db05542?w=160&q=80',
    cities: [
      { name: 'Calgary', lat: 51.05, lng: -114.07 },
      { name: 'Edmonton', lat: 53.55, lng: -113.49 },
      { name: 'Red Deer', lat: 52.27, lng: -113.81 },
    ],
  },
  {
    code: 'ON', name: 'Ontario', lat: 49.5, lng: -86, image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=160&q=80',
    cities: [
      { name: 'Toronto', lat: 43.65, lng: -79.38 },
      { name: 'Ottawa', lat: 45.42, lng: -75.7 },
      { name: 'Mississauga', lat: 43.59, lng: -79.64 },
      { name: 'Hamilton', lat: 43.26, lng: -79.87 },
      { name: 'London', lat: 42.98, lng: -81.25 },
    ],
  },
  {
    code: 'QC', name: 'Québec', lat: 52, lng: -72, image: 'https://images.unsplash.com/photo-1519178614-68673b201f36?w=160&q=80',
    cities: [
      { name: 'Montréal', lat: 45.5, lng: -73.57 },
      { name: 'Québec City', lat: 46.81, lng: -71.21 },
      { name: 'Laval', lat: 45.6, lng: -73.71 },
      { name: 'Gatineau', lat: 45.48, lng: -75.7 },
    ],
  },
  {
    code: 'SK', name: 'Saskatchewan', lat: 54, lng: -106, image: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=160&q=80',
    cities: [
      { name: 'Saskatoon', lat: 52.13, lng: -106.67 },
      { name: 'Regina', lat: 50.45, lng: -104.61 },
    ],
  },
  {
    code: 'MB', name: 'Manitoba', lat: 54, lng: -97.5, image: 'https://images.unsplash.com/photo-1597006438013-0f0cc8b5b8c0?w=160&q=80',
    cities: [
      { name: 'Winnipeg', lat: 49.9, lng: -97.14 },
      { name: 'Brandon', lat: 49.85, lng: -99.95 },
    ],
  },
  {
    code: 'NB', name: 'New Brunswick', lat: 46.6, lng: -66.5, image: 'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=160&q=80',
    cities: [
      { name: 'Moncton', lat: 46.09, lng: -64.77 },
      { name: 'Fredericton', lat: 45.96, lng: -66.64 },
      { name: 'Saint John', lat: 45.27, lng: -66.06 },
    ],
  },
  {
    code: 'NS', name: 'Nova Scotia', lat: 45.2, lng: -63, image: 'https://images.unsplash.com/photo-1499591934245-40b55745b905?w=160&q=80',
    cities: [
      { name: 'Halifax', lat: 44.65, lng: -63.57 },
      { name: 'Sydney', lat: 46.14, lng: -60.19 },
    ],
  },
  {
    code: 'PE', name: 'Prince Edward Island', lat: 46.4, lng: -63.2, image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=160&q=80',
    cities: [{ name: 'Charlottetown', lat: 46.24, lng: -63.13 }],
  },
  {
    code: 'NL', name: 'Newfoundland & Labrador', lat: 52.5, lng: -59, image: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=160&q=80',
    cities: [
      { name: "St. John's", lat: 47.56, lng: -52.71 },
      { name: 'Corner Brook', lat: 48.95, lng: -57.95 },
    ],
  },
];

// At the overview zoom, the smaller provinces are grouped into count clusters.
const CLUSTERS: Cluster[] = [
  { code: 'PRAIRIES', label: '2', lat: 53.8, lng: -101.5, members: ['SK', 'MB'] },
  { code: 'ATLANTIC', label: '4', lat: 47.6, lng: -62, members: ['NB', 'NS', 'PE', 'NL'] },
];
const OVERVIEW_PROVINCES = ['BC', 'AB', 'ON', 'QC'];

const byCode = (code: string) => PROVINCES.find((p) => p.code === code)!;

type View = { kind: 'overview' } | { kind: 'cluster'; code: string } | { kind: 'province'; code: string };

type Marker =
  | { type: 'province'; lat: number; lng: number; province: Province }
  | { type: 'cluster'; lat: number; lng: number; cluster: Cluster }
  | { type: 'city'; lat: number; lng: number; city: City };

function markersFor(view: View): Marker[] {
  if (view.kind === 'province') {
    return byCode(view.code).cities.map((city) => ({ type: 'city' as const, lat: city.lat, lng: city.lng, city }));
  }
  if (view.kind === 'cluster') {
    const cluster = CLUSTERS.find((c) => c.code === view.code);
    return (cluster?.members ?? []).map((code) => {
      const province = byCode(code);
      return { type: 'province' as const, lat: province.lat, lng: province.lng, province };
    });
  }
  return [
    ...OVERVIEW_PROVINCES.map((code) => {
      const province = byCode(code);
      return { type: 'province' as const, lat: province.lat, lng: province.lng, province };
    }),
    ...CLUSTERS.map((cluster) => ({ type: 'cluster' as const, lat: cluster.lat, lng: cluster.lng, cluster })),
  ];
}

const COUNTRIES_GEOJSON = '/data/countries.geojson';
const PROVINCES_GEOJSON = '/data/provinces.geojson';

export default function HeroGlobe() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<InstanceType<typeof import('globe.gl').default> | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>({ kind: 'overview' });
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Animate the camera and switch what the markers show.
  const applyView = useCallback((next: View, moveCamera: boolean) => {
    viewRef.current = next;
    setView(next);
    if (!moveCamera) return;
    const globe = globeRef.current;
    if (!globe) return;
    if (next.kind === 'province') {
      const p = byCode(next.code);
      globe.pointOfView({ lat: p.lat - 4, lng: p.lng, altitude: 0.9 }, 900);
    } else if (next.kind === 'cluster') {
      const c = CLUSTERS.find((cl) => cl.code === next.code);
      if (c) globe.pointOfView({ lat: c.lat - 2, lng: c.lng, altitude: 1.2 }, 900);
    } else {
      globe.pointOfView({ lat: 54, lng: -96, altitude: 1.86 }, 900);
    }
  }, []);

  const applyViewRef = useRef(applyView);
  useEffect(() => {
    applyViewRef.current = applyView;
  }, [applyView]);

  const buildMarker = useCallback(
    (marker: Marker): HTMLElement => {
      const el = document.createElement('div');
      el.style.transform = 'translate(-50%, -50%)';
      el.style.cursor = 'pointer';

      if (marker.type === 'province') {
        el.innerHTML = `
          <div style="position:relative;width:50px;height:50px;border-radius:9999px;overflow:hidden;border:2px solid #fff;box-shadow:0 10px 24px rgba(15,23,41,0.25);background-image:url('${marker.province.image}');background-size:cover;background-position:center;">
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(15,23,41,0.34);color:#fff;font-family:var(--font-body-sans);font-size:13px;font-weight:600;">${marker.province.code}</div>
          </div>`;
        el.addEventListener('click', (event) => {
          event.stopPropagation();
          applyViewRef.current({ kind: 'province', code: marker.province.code }, true);
        });
      } else if (marker.type === 'cluster') {
        el.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:#0F1729;color:#fff;box-shadow:0 8px 20px rgba(15,23,41,0.28);font-family:var(--font-body-sans);font-size:13px;font-weight:600;">${marker.cluster.label}</div>`;
        el.addEventListener('click', (event) => {
          event.stopPropagation();
          applyViewRef.current({ kind: 'cluster', code: marker.cluster.code }, true);
        });
      } else {
        el.innerHTML = `
          <div style="display:flex;align-items:center;gap:7px;background:#fff;border-radius:9999px;padding:5px 12px 5px 7px;box-shadow:0 8px 20px rgba(15,23,41,0.22);white-space:nowrap;">
            <span style="width:9px;height:9px;border-radius:9999px;background:var(--color-brand-600,#438ab6);box-shadow:0 0 0 3px rgba(67,138,182,0.18);"></span>
            <span style="font-family:var(--font-body-sans);font-size:13px;font-weight:600;color:#0F1729;">${marker.city.name}</span>
          </div>`;
        el.addEventListener('click', (event) => {
          event.stopPropagation();
          router.push('/');
        });
      }
      return el;
    },
    [router]
  );

  // Build the globe once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let destroyed = false;
    let globe: InstanceType<typeof import('globe.gl').default> | null = null;
    let resizeObserver: ResizeObserver | undefined;

    (async () => {
      const Globe = (await import('globe.gl')).default;
      if (destroyed) return;

      try {
        globe = new Globe(el, { animateIn: false })
          .backgroundColor('rgba(0,0,0,0)')
          .showGlobe(true)
          .showAtmosphere(false)
          .htmlElementsData(markersFor(viewRef.current))
          .htmlLat((d) => (d as Marker).lat)
          .htmlLng((d) => (d as Marker).lng)
          .htmlAltitude(0.015)
          .htmlElement((d) => buildMarker(d as Marker));
        globeRef.current = globe;

        const THREE = await import('three');
        globe.globeMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff }));
        globe.lights([new THREE.AmbientLight(0xffffff, 1.1)]);

        const controls = globe.controls() as unknown as {
          autoRotate: boolean;
          enableZoom: boolean;
          enablePan: boolean;
          minDistance: number;
          maxDistance: number;
          addEventListener: (type: string, cb: () => void) => void;
        };
        controls.autoRotate = false;
        controls.enableZoom = true;
        controls.enablePan = false;
        controls.maxDistance = 286;
        controls.minDistance = 120;

        // Zoom drives the same expand/collapse as clicking.
        controls.addEventListener('change', () => {
          if (!globeRef.current) return;
          const pov = globeRef.current.pointOfView();
          const current = viewRef.current;
          if (pov.altitude > 1.45 && current.kind !== 'overview') {
            applyViewRef.current({ kind: 'overview' }, false);
          } else if (pov.altitude < 1.05 && current.kind === 'overview') {
            const nearest = [...PROVINCES].sort(
              (a, b) => Math.hypot(a.lat - pov.lat, a.lng - pov.lng) - Math.hypot(b.lat - pov.lat, b.lng - pov.lng)
            )[0];
            if (nearest) applyViewRef.current({ kind: 'province', code: nearest.code }, false);
          }
        });

        globe.pointOfView({ lat: 54, lng: -96, altitude: 1.86 }, 0);

        const resize = () => {
          if (!globe) return;
          globe.width(el.clientWidth).height(el.clientHeight);
        };
        resize();
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(el);

        try {
          const [countriesRes, provincesRes] = await Promise.all([
            fetch(COUNTRIES_GEOJSON),
            fetch(PROVINCES_GEOJSON),
          ]);
          const countries = await countriesRes.json();
          const provinces = await provincesRes.json();
          if (!destroyed && globe) {
            const features = [
              ...countries.features.map((f: object) => ({ ...f, __province: false })),
              ...provinces.features.map((f: object) => ({ ...f, __province: true })),
            ];
            globe
              .polygonsData(features)
              .polygonCapColor(() => '#e9eff6')
              .polygonSideColor(() => 'rgba(175,193,214,0.28)')
              .polygonStrokeColor(() => '#c2cdda')
              .polygonAltitude((d) => ((d as { __province?: boolean }).__province ? 0.0025 : 0.001));
          }
        } catch {
          // Globe still renders without continents.
        }

        if (!destroyed) setReady(true);
      } catch {
        // WebGL unavailable — leave the hero space empty rather than crashing.
      }
    })();

    return () => {
      destroyed = true;
      resizeObserver?.disconnect();
      const instance = globeRef.current as unknown as { _destructor?: () => void } | null;
      instance?._destructor?.();
      globeRef.current = null;
      el.innerHTML = '';
    };
  }, [buildMarker]);

  // Update markers whenever the view changes.
  useEffect(() => {
    if (!ready || !globeRef.current) return;
    globeRef.current.htmlElementsData(markersFor(view));
  }, [view, ready]);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full cursor-grab touch-none transition-opacity duration-[1200ms] ease-out active:cursor-grabbing ${ready ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}
