'use client';
import { useEffect, useRef } from 'react';

// Canadian metros shown as labels on the globe.
type Marker = { name: string; lat: number; lng: number };
const MARKERS: Marker[] = [
  { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
  { name: 'Montréal', lat: 45.5019, lng: -73.5674 },
  { name: 'Calgary', lat: 51.0447, lng: -114.0719 },
  { name: 'Ottawa', lat: 45.4215, lng: -75.6972 },
];

const COUNTRIES_GEOJSON =
  'https://vasturiano.github.io/globe.gl/example/datasets/ne_110m_admin_0_countries.geojson';

export default function HeroGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);

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
      globe = new Globe(el)
        .backgroundColor('rgba(0,0,0,0)')
        .showGlobe(true)
        .showAtmosphere(true)
        .atmosphereColor('#92c9e3')
        .atmosphereAltitude(0.2)
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.32)
        .hexPolygonAltitude(0.004)
        .hexPolygonColor(() => '#438ab6')
        .labelsData(MARKERS)
        .labelLat((d) => (d as Marker).lat)
        .labelLng((d) => (d as Marker).lng)
        .labelText((d) => (d as Marker).name)
        .labelSize(1.05)
        .labelDotRadius(0.42)
        .labelColor(() => '#0F1729')
        .labelResolution(2)
        .labelAltitude(0.01);

      // Light, paper-white sphere to match the hero.
      const material = globe.globeMaterial() as { color: { set: (c: string) => void }; shininess?: number };
      material.color.set('#f1f6fb');
      if ('shininess' in material) material.shininess = 4;

      const controls = globe.controls() as {
        autoRotate: boolean;
        autoRotateSpeed: number;
        enableZoom: boolean;
        enablePan: boolean;
      };
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.7;
      controls.enableZoom = false;
      controls.enablePan = false;

      globe.pointOfView({ lat: 44, lng: -96, altitude: 2.1 }, 0);

      const resize = () => {
        if (!globe) return;
        const size = el.clientWidth;
        globe.width(size).height(size);
      };
      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(el);

        try {
          const response = await fetch(COUNTRIES_GEOJSON);
          const geo = await response.json();
          if (!destroyed && globe) globe.hexPolygonsData(geo.features);
        } catch {
          // Globe still renders (sphere + atmosphere + labels) without continents.
        }
      } catch {
        // WebGL unavailable — leave the hero space empty rather than crashing.
      }
    })();

    return () => {
      destroyed = true;
      resizeObserver?.disconnect();
      const instance = globe as unknown as { _destructor?: () => void } | null;
      instance?._destructor?.();
      el.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="mx-auto aspect-square w-[clamp(280px,48vw,520px)] cursor-grab touch-none active:cursor-grabbing"
    />
  );
}
