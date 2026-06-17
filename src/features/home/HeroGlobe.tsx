'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type City = { name: string; lat: number; lng: number; image: string; province: string };
type Province = { code: string; name: string; lat: number; lng: number; image: string; cities: Omit<City, 'image' | 'province'>[] };
type Cluster = { code: string; label: string; lat: number; lng: number; members: string[] };

const CITY_IMAGES = [
  'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=120&q=80',
  'https://images.unsplash.com/photo-1560814304-4f05b62af116?w=120&q=80',
  'https://images.unsplash.com/photo-1609825488888-3a766db05542?w=120&q=80',
  'https://images.unsplash.com/photo-1519178614-68673b201f36?w=120&q=80',
  'https://images.unsplash.com/photo-1499591934245-40b55745b905?w=120&q=80',
  'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=120&q=80',
  'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=120&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&q=80',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=120&q=80',
  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=120&q=80',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=120&q=80',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=120&q=80',
];
function cityImage(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return CITY_IMAGES[hash % CITY_IMAGES.length];
}

const PROVINCES: Province[] = [
  { code: 'BC', name: 'British Columbia', lat: 55, lng: -128, image: 'https://images.unsplash.com/photo-1560814304-4f05b62af116?w=160&q=80', cities: [
    { name: 'Vancouver', lat: 49.28, lng: -123.12 }, { name: 'Victoria', lat: 48.43, lng: -123.37 }, { name: 'Kelowna', lat: 49.89, lng: -119.5 }, { name: 'Surrey', lat: 49.19, lng: -122.85 } ] },
  { code: 'AB', name: 'Alberta', lat: 51, lng: -117, image: 'https://images.unsplash.com/photo-1609825488888-3a766db05542?w=160&q=80', cities: [
    { name: 'Calgary', lat: 51.05, lng: -114.07 }, { name: 'Edmonton', lat: 53.55, lng: -113.49 }, { name: 'Red Deer', lat: 52.27, lng: -113.81 } ] },
  { code: 'ON', name: 'Ontario', lat: 46, lng: -83, image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=160&q=80', cities: [
    { name: 'Toronto', lat: 43.65, lng: -79.38 }, { name: 'Ottawa', lat: 45.42, lng: -75.7 }, { name: 'Mississauga', lat: 43.59, lng: -79.64 }, { name: 'Hamilton', lat: 43.26, lng: -79.87 }, { name: 'London', lat: 42.98, lng: -81.25 } ] },
  { code: 'QC', name: 'Québec', lat: 52, lng: -72, image: 'https://images.unsplash.com/photo-1519178614-68673b201f36?w=160&q=80', cities: [
    { name: 'Montréal', lat: 45.5, lng: -73.57 }, { name: 'Québec City', lat: 46.81, lng: -71.21 }, { name: 'Laval', lat: 45.6, lng: -73.71 }, { name: 'Gatineau', lat: 45.48, lng: -75.7 } ] },
  { code: 'SK', name: 'Saskatchewan', lat: 56, lng: -105, image: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=160&q=80', cities: [
    { name: 'Saskatoon', lat: 52.13, lng: -106.67 }, { name: 'Regina', lat: 50.45, lng: -104.61 } ] },
  { code: 'MB', name: 'Manitoba', lat: 50.5, lng: -94, image: 'https://images.unsplash.com/photo-1574721363169-7a92a80a03a9?w=160&q=80', cities: [
    { name: 'Winnipeg', lat: 49.9, lng: -97.14 }, { name: 'Brandon', lat: 49.85, lng: -99.95 } ] },
  { code: 'NB', name: 'New Brunswick', lat: 46.6, lng: -66.5, image: 'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=160&q=80', cities: [
    { name: 'Moncton', lat: 46.09, lng: -64.77 }, { name: 'Fredericton', lat: 45.96, lng: -66.64 }, { name: 'Saint John', lat: 45.27, lng: -66.06 } ] },
  { code: 'NS', name: 'Nova Scotia', lat: 45.2, lng: -63, image: 'https://images.unsplash.com/photo-1499591934245-40b55745b905?w=160&q=80', cities: [
    { name: 'Halifax', lat: 44.65, lng: -63.57 }, { name: 'Sydney', lat: 46.14, lng: -60.19 } ] },
  { code: 'PE', name: 'Prince Edward Island', lat: 46.4, lng: -63.2, image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=160&q=80', cities: [
    { name: 'Charlottetown', lat: 46.24, lng: -63.13 } ] },
  { code: 'NL', name: 'Newfoundland & Labrador', lat: 52.5, lng: -59, image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=160&q=80', cities: [
    { name: "St. John's", lat: 47.56, lng: -52.71 }, { name: 'Corner Brook', lat: 48.95, lng: -57.95 } ] },
];

const CLUSTERS: Cluster[] = [
  { code: 'ATLANTIC', label: '4', lat: 47.6, lng: -62, members: ['NB', 'NS', 'PE', 'NL'] },
];
const OVERVIEW_PROVINCES = ['BC', 'AB', 'SK', 'MB', 'ON', 'QC'];

const byCode = (code: string) => PROVINCES.find((p) => p.code === code)!;
// Spread each province's cities apart from their centroid so the bubbles
// don't overlap (exact map position isn't important here).
const SPREAD = 2.6;
const ALL_CITIES: City[] = PROVINCES.flatMap((p) => {
  const cLat = p.cities.reduce((s, c) => s + c.lat, 0) / p.cities.length;
  const cLng = p.cities.reduce((s, c) => s + c.lng, 0) / p.cities.length;
  return p.cities.map((c) => ({
    name: c.name,
    lat: cLat + (c.lat - cLat) * SPREAD,
    lng: cLng + (c.lng - cLng) * SPREAD,
    image: cityImage(c.name),
    province: p.code,
  }));
});

type Marker =
  | { type: 'province'; lat: number; lng: number; province: Province }
  | { type: 'pcluster'; lat: number; lng: number; cluster: Cluster }
  | { type: 'city'; lat: number; lng: number; city: City }
  | { type: 'ccluster'; lat: number; lng: number; count: number; cities: City[] };

const COUNTRIES_GEOJSON = '/data/countries.geojson';
const PROVINCES_GEOJSON = '/data/provinces.geojson';

function angularDist(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const k = Math.cos(((aLat + bLat) / 2) * (Math.PI / 180));
  return Math.hypot(aLat - bLat, (aLng - bLng) * k);
}

function thresholdFor(altitude: number): number {
  // No hard floor — as you zoom in the cluster radius keeps shrinking so
  // numbered clusters auto-split all the way down to individual cities.
  return Math.min(4, Math.max(0.08, altitude * 2.5));
}

// Centre + a fitting altitude for a set of cities.
function frameOf(cities: { lat: number; lng: number }[]): { lat: number; lng: number; altitude: number } {
  const lat = cities.reduce((s, c) => s + c.lat, 0) / cities.length;
  const lng = cities.reduce((s, c) => s + c.lng, 0) / cities.length;
  let maxD = 0;
  for (let i = 0; i < cities.length; i += 1) {
    for (let j = i + 1; j < cities.length; j += 1) {
      maxD = Math.max(maxD, angularDist(cities[i].lat, cities[i].lng, cities[j].lat, cities[j].lng));
    }
  }
  return { lat, lng, altitude: Math.min(0.5, Math.max(0.16, maxD * 0.06)) };
}

function cityMarkers(thresholdDeg: number, forced: Set<string>): Marker[] {
  const groups: { lat: number; lng: number; items: City[] }[] = [];
  const forcedCities: Marker[] = [];
  for (const city of ALL_CITIES) {
    if (forced.has(city.name)) {
      forcedCities.push({ type: 'city', lat: city.lat, lng: city.lng, city });
      continue;
    }
    const group = groups.find((g) => angularDist(g.lat, g.lng, city.lat, city.lng) < thresholdDeg);
    if (group) {
      group.items.push(city);
      group.lat = group.items.reduce((s, c) => s + c.lat, 0) / group.items.length;
      group.lng = group.items.reduce((s, c) => s + c.lng, 0) / group.items.length;
    } else {
      groups.push({ lat: city.lat, lng: city.lng, items: [city] });
    }
  }
  const clusters: Marker[] = [];
  const cities: Marker[] = [];
  for (const g of groups) {
    if (g.items.length === 1) cities.push({ type: 'city', lat: g.items[0].lat, lng: g.items[0].lng, city: g.items[0] });
    else clusters.push({ type: 'ccluster', lat: g.lat, lng: g.lng, count: g.items.length, cities: g.items });
  }
  // Clusters underneath, individual cities on top.
  return [...clusters, ...forcedCities, ...cities];
}

type PinEl = HTMLElement & { __activate?: () => void };

export default function HeroGlobe() {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let destroyed = false;
    let globe: InstanceType<typeof import('globe.gl').default> | null = null;
    let resizeObserver: ResizeObserver | undefined;
    let wheelHandler: ((event: WheelEvent) => void) | undefined;
    let downHandler: ((event: PointerEvent) => void) | undefined;
    let upHandler: ((event: PointerEvent) => void) | undefined;
    let moveHandler: ((event: PointerEvent) => void) | undefined;

    (async () => {
      const Globe = (await import('globe.gl')).default;
      if (destroyed) return;

      try {
        // 'province' = province bubbles (with at most one expanded into its
        // cities); 'cities' = every province shown as cities (deep zoom).
        let mode: 'province' | 'cities' = 'province';
        let expanded: string | null = null; // province expanded into its cities
        let clusterOpen = false; // Atlantic cluster opened into its 4 provinces
        let forced = new Set<string>(); // city-cluster members forced to show individually
        let bucket = -1;
        let suppressUntil = 0;

        // A province renders as its cities when expanded, otherwise as a bubble.
        const pushProvince = (markers: Marker[], code: string) => {
          if (code === expanded) {
            ALL_CITIES.filter((c) => c.province === code).forEach((city) =>
              markers.push({ type: 'city', lat: city.lat, lng: city.lng, city })
            );
          } else {
            const p = byCode(code);
            markers.push({ type: 'province', lat: p.lat, lng: p.lng, province: p });
          }
        };

        const provinceModeMarkers = (): Marker[] => {
          const markers: Marker[] = [];
          OVERVIEW_PROVINCES.forEach((code) => pushProvince(markers, code));
          const atlantic = CLUSTERS[0];
          if (clusterOpen) {
            // Cluster opened: its members become individual province bubbles.
            atlantic.members.forEach((code) => pushProvince(markers, code));
          } else {
            markers.push({ type: 'pcluster', lat: atlantic.lat, lng: atlantic.lng, cluster: atlantic });
          }
          return markers;
        };

        const renderMarkers = (altOverride?: number) => {
          if (!globe) return;
          if (mode === 'cities') {
            const alt = altOverride ?? globe.pointOfView().altitude ?? 1;
            bucket = Math.round(thresholdFor(alt) * 8);
            globe.htmlElementsData(cityMarkers(thresholdFor(alt), forced));
          } else {
            globe.htmlElementsData(provinceModeMarkers());
          }
        };

        const goTo = (lat: number, lng: number, altitude: number) => {
          if (!globe) return;
          suppressUntil = Date.now() + 950;
          globe.pointOfView({ lat, lng, altitude }, 800);
          window.setTimeout(() => {
            if (!destroyed) renderMarkers();
          }, 950);
        };

        // Expand one province into its cities while the other provinces stay as
        // bubbles. Zoom right in on it; only an even deeper zoom flips into the
        // all-provinces cities mode.
        const expandProvince = (code: string) => {
          mode = 'province';
          expanded = code;
          const cities = ALL_CITIES.filter((c) => c.province === code);
          const cLat = cities.reduce((s, c) => s + c.lat, 0) / cities.length;
          const cLng = cities.reduce((s, c) => s + c.lng, 0) / cities.length;
          renderMarkers();
          goTo(cLat, cLng, 0.55);
        };

        // Open the Atlantic cluster into its 4 member provinces (still bubbles).
        const openCluster = () => {
          const atlantic = CLUSTERS[0];
          mode = 'province';
          clusterOpen = true;
          expanded = null;
          renderMarkers();
          goTo(atlantic.lat, atlantic.lng, 1.2);
        };

        const buildMarker = (marker: Marker): PinEl => {
          const el2 = document.createElement('div') as PinEl;
          el2.dataset.pin = '1';
          el2.style.pointerEvents = 'none'; // drags/zoom pass through to the globe; clicks via hit-test
          if (marker.type === 'province') {
            el2.style.zIndex = '3';
            el2.dataset.z = '3';
            el2.innerHTML = `<div style="position:relative;width:50px;height:50px;border-radius:9999px;overflow:hidden;border:2px solid #fff;box-shadow:0 4px 12px rgba(15,23,41,0.16);background-image:url('${marker.province.image}');background-size:cover;background-position:center;"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(15,23,41,0.34);color:#fff;font-family:var(--font-body-sans);font-size:13px;font-weight:600;">${marker.province.code}</div></div>`;
            el2.__activate = () => expandProvince(marker.province.code);
          } else if (marker.type === 'pcluster') {
            el2.style.zIndex = '1';
            el2.dataset.z = '1';
            el2.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:9999px;background:#0F1729;color:#fff;box-shadow:0 4px 12px rgba(15,23,41,0.18);font-family:var(--font-body-sans);font-size:14px;font-weight:600;">${marker.cluster.label}</div>`;
            el2.__activate = () => openCluster();
          } else if (marker.type === 'ccluster') {
            el2.style.zIndex = '1';
            el2.dataset.z = '1';
            el2.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:9999px;background:#0F1729;color:#fff;box-shadow:0 4px 12px rgba(15,23,41,0.18);font-family:var(--font-body-sans);font-size:14px;font-weight:600;">${marker.count}</div>`;
            el2.__activate = () => {
              // Force this cluster's cities to render individually (don't rely on
              // the zoom level splitting them), then zoom in to frame them —
              // never out: target altitude stays below the current one.
              marker.cities.forEach((c) => forced.add(c.name));
              renderMarkers();
              const f = frameOf(marker.cities);
              const cur = globe?.pointOfView().altitude ?? 0.4;
              goTo(f.lat, f.lng, Math.max(0.12, Math.min(f.altitude, cur * 0.55)));
            };
          } else {
            el2.style.zIndex = '2';
            el2.dataset.z = '2';
            el2.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;"><span style="display:block;width:46px;height:46px;border-radius:9999px;overflow:hidden;border:2px solid #fff;box-shadow:0 3px 10px rgba(15,23,41,0.15);background-image:url('${marker.city.image}');background-size:cover;background-position:center;"></span><span style="background:#fff;border-radius:9999px;padding:3px 11px;box-shadow:0 2px 8px rgba(15,23,41,0.12);font-family:var(--font-body-sans);font-size:12px;font-weight:600;line-height:1.1;color:#0F1729;white-space:nowrap;">${marker.city.name}</span></div>`;
            el2.__activate = () => routerRef.current.push('/');
          }
          return el2;
        };

        globe = new Globe(el, { animateIn: false, rendererConfig: { antialias: true } })
          .backgroundColor('rgba(0,0,0,0)')
          .showGlobe(true)
          .showAtmosphere(false)
          .htmlElementsData(provinceModeMarkers())
          .htmlLat((d) => (d as Marker).lat)
          .htmlLng((d) => (d as Marker).lng)
          .htmlAltitude(0.015)
          .htmlElement((d) => buildMarker(d as Marker));

        const THREE = await import('three');
        globe.globeMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff }));
        globe.lights([new THREE.AmbientLight(0xffffff, 1.1)]);

        // globe.gl measures camera distance as globeRadius * (1 + altitude) and
        // its globe radius is 100 — so a minDistance below the radius puts the
        // camera INSIDE the sphere (back-face culled → globe vanishes and can't
        // recover). Derive the clamp from the real radius so we stay safely
        // outside on zoom-in and locked on zoom-out. globe.gl also resets these
        // in its own init, so we re-assert them on every change event below.
        const globeR = (globe as unknown as { getGlobeRadius?: () => number }).getGlobeRadius?.() ?? 100;
        const MIN_DISTANCE = globeR * 1.08; // ~alt 0.08 — always outside the globe
        const MAX_DISTANCE = globeR * 3.0; // ~alt 2.0 — locked zoom-out, globe still fully visible
        const controls = globe.controls() as unknown as {
          autoRotate: boolean;
          enableZoom: boolean;
          enablePan: boolean;
          rotateSpeed: number;
          zoomSpeed: number;
          zoomToCursor: boolean;
          minDistance: number;
          maxDistance: number;
          addEventListener: (type: string, cb: () => void) => void;
        };
        controls.autoRotate = false;
        controls.enableZoom = true;
        controls.enablePan = false;
        controls.rotateSpeed = 2.1;
        controls.zoomSpeed = 2.7;
        controls.zoomToCursor = true;
        controls.maxDistance = MAX_DISTANCE;
        controls.minDistance = MIN_DISTANCE;

        controls.addEventListener('change', () => {
          if (!globe) return;
          // Re-assert the clamp every change — globe.gl resets maxDistance to
          // 10000 on init, so this is what actually locks the zoom-out.
          controls.maxDistance = MAX_DISTANCE;
          controls.minDistance = MIN_DISTANCE;
          if (Date.now() < suppressUntil) return;
          const alt = globe.pointOfView().altitude ?? 1.86;
          if (alt > 1.45) {
            // Zoomed out to the overview: province bubbles, nothing expanded,
            // Atlantic cluster closed again.
            if (mode !== 'province' || expanded !== null || clusterOpen) {
              mode = 'province';
              expanded = null;
              clusterOpen = false;
              forced = new Set();
              renderMarkers();
            }
          } else if (alt < 0.4) {
            // Zoomed in much further: every province shown as its cities, clustered.
            if (mode !== 'cities') {
              mode = 'cities';
              forced = new Set();
              renderMarkers();
            } else if (Math.round(thresholdFor(alt) * 8) !== bucket) {
              renderMarkers();
            }
          } else if (mode !== 'province') {
            // Mid zoom returning from cities mode: back to province bubbles.
            mode = 'province';
            expanded = null;
            clusterOpen = false;
            forced = new Set();
            renderMarkers();
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

        wheelHandler = (event: WheelEvent) => event.preventDefault();
        el.addEventListener('wheel', wheelHandler, { passive: false });

        // Pins are pointer-events:none so the globe can be dragged/zoomed over them;
        // a tap that doesn't move hit-tests the pins and activates the top-most one.
        const hitTest = (x: number, y: number): PinEl | null => {
          const pins = Array.from(el.querySelectorAll<PinEl>('[data-pin="1"]'));
          let best: PinEl | null = null;
          let bestZ = -1;
          for (const pin of pins) {
            const r = pin.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
              const z = Number(pin.dataset.z ?? '0');
              if (z >= bestZ) {
                bestZ = z;
                best = pin;
              }
            }
          }
          return best;
        };
        let downX = 0;
        let downY = 0;
        downHandler = (event: PointerEvent) => {
          downX = event.clientX;
          downY = event.clientY;
          el.style.cursor = '';
        };
        upHandler = (event: PointerEvent) => {
          if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) return;
          hitTest(event.clientX, event.clientY)?.__activate?.();
        };
        moveHandler = (event: PointerEvent) => {
          if (event.buttons !== 0) return;
          el.style.cursor = hitTest(event.clientX, event.clientY) ? 'pointer' : 'grab';
        };
        el.addEventListener('pointerdown', downHandler);
        el.addEventListener('pointerup', upHandler);
        el.addEventListener('pointermove', moveHandler);

        // Reveal the sphere + pins immediately; continents stream in after.
        if (!destroyed) setReady(true);

        try {
          const [countriesRes, provincesRes] = await Promise.all([fetch(COUNTRIES_GEOJSON), fetch(PROVINCES_GEOJSON)]);
          const countries = await countriesRes.json();
          const provinces = await provincesRes.json();
          if (!destroyed && globe) {
            // Where a country is subdivided into provinces, drop the country
            // polygon so the two layers don't overlap & z-fight (white flashes).
            const provincedAdmins = new Set<string>(
              provinces.features
                .map((f: { properties?: { admin?: string } }) => f.properties?.admin)
                .filter((a: string | undefined): a is string => Boolean(a))
            );
            const countryFeatures = countries.features
              .filter((f: { properties?: { ADMIN?: string; NAME?: string } }) =>
                !provincedAdmins.has(f.properties?.ADMIN ?? f.properties?.NAME ?? '')
              )
              .map((f: object) => ({ ...f, __province: false }));
            const provinceFeatures = provinces.features.map((f: object) => ({ ...f, __province: true }));
            globe
              .polygonsTransitionDuration(1100)
              .polygonsData([...countryFeatures, ...provinceFeatures])
              .polygonCapColor(() => '#e9eff6')
              .polygonSideColor(() => 'rgba(150,170,198,0.45)')
              .polygonStrokeColor(() => '#d2dbe6')
              .polygonAltitude(() => 0.0025);
          }
        } catch {
          // Globe still renders without continents.
        }
      } catch {
        // WebGL unavailable — leave the hero space empty rather than crashing.
      }
    })();

    return () => {
      destroyed = true;
      resizeObserver?.disconnect();
      if (wheelHandler) el.removeEventListener('wheel', wheelHandler);
      if (downHandler) el.removeEventListener('pointerdown', downHandler);
      if (upHandler) el.removeEventListener('pointerup', upHandler);
      if (moveHandler) el.removeEventListener('pointermove', moveHandler);
      const instance = globe as unknown as { _destructor?: () => void } | null;
      instance?._destructor?.();
      el.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full cursor-grab touch-none transition-opacity duration-[1200ms] ease-out active:cursor-grabbing ${ready ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}
