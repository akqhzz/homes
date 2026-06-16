'use client';
import { useEffect, useRef } from 'react';

type Pin = {
  label: string;
  lat: number;
  lng: number;
  image?: string;
};

// Floating province markers positioned over Canada, à la zoocasa's globe.
const PINS: Pin[] = [
  { label: 'BC', lat: 53, lng: -124, image: 'https://images.unsplash.com/photo-1560814304-4f05b62af116?w=160&q=80' },
  { label: '3', lat: 57, lng: -101 },
  { label: 'ON', lat: 49, lng: -86, image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=160&q=80' },
  { label: '4', lat: 51, lng: -69 },
  { label: 'NL', lat: 54, lng: -59, image: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=160&q=80' },
];

const COUNTRIES_GEOJSON = '/data/countries.geojson';

function createPinElement(pin: Pin): HTMLElement {
  const el = document.createElement('div');
  el.style.pointerEvents = 'none';
  if (pin.image) {
    el.innerHTML = `
      <div style="position:relative;width:52px;height:52px;border-radius:9999px;overflow:hidden;border:2px solid #fff;box-shadow:0 10px 24px rgba(15,23,41,0.25);background-image:url('${pin.image}');background-size:cover;background-position:center;">
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(15,23,41,0.32);color:#fff;font-family:var(--font-body-sans);font-size:13px;font-weight:600;">${pin.label}</div>
      </div>`;
  } else {
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:#0F1729;color:#fff;box-shadow:0 8px 20px rgba(15,23,41,0.28);font-family:var(--font-body-sans);font-size:13px;font-weight:600;">${pin.label}</div>`;
  }
  return el;
}

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
          .showAtmosphere(false)
          .htmlElementsData(PINS)
          .htmlLat((d) => (d as Pin).lat)
          .htmlLng((d) => (d as Pin).lng)
          .htmlAltitude(0.02)
          .htmlElement((d) => createPinElement(d as Pin));

        // Pure-white, unlit sphere (no shaded hemisphere) + soft ambient so the
        // light-grey continents stay readable.
        const THREE = await import('three');
        globe.globeMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff }));
        globe.lights([new THREE.AmbientLight(0xffffff, 1.1)]);

        const controls = globe.controls() as unknown as {
          autoRotate: boolean;
          autoRotateSpeed: number;
          enableZoom: boolean;
          enablePan: boolean;
          minDistance: number;
          maxDistance: number;
        };
        controls.autoRotate = false;
        controls.enableZoom = true;
        controls.enablePan = false;
        // Default is the most zoomed-out size; zoom-in can grow the globe well
        // past the section (it bleeds off the edges rather than into a box).
        controls.maxDistance = 250;
        controls.minDistance = 130;

        globe.pointOfView({ lat: 54, lng: -96, altitude: 1.5 }, 0);

        const resize = () => {
          if (!globe) return;
          globe.width(el.clientWidth).height(el.clientHeight);
        };
        resize();
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(el);

        try {
          const response = await fetch(COUNTRIES_GEOJSON);
          const geo = await response.json();
          if (!destroyed && globe) {
            globe
              .polygonsData(geo.features)
              .polygonCapColor(() => '#e8eef4')
              .polygonSideColor(() => 'rgba(180,198,218,0.08)')
              .polygonStrokeColor(() => '#cfd8e3')
              .polygonAltitude(0.008);
          }
        } catch {
          // Globe still renders (white sphere + pins) without continents.
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
      className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
    />
  );
}
