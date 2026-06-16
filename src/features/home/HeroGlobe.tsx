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

const COUNTRIES_GEOJSON =
  'https://vasturiano.github.io/globe.gl/example/datasets/ne_110m_admin_0_countries.geojson';

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
          .showAtmosphere(true)
          .atmosphereColor('#cfe0ee')
          .atmosphereAltitude(0.16)
          .htmlElementsData(PINS)
          .htmlLat((d) => (d as Pin).lat)
          .htmlLng((d) => (d as Pin).lng)
          .htmlAltitude(0.02)
          .htmlElement((d) => createPinElement(d as Pin));

        // White sphere with light-grey filled continents.
        const material = globe.globeMaterial() as { color: { set: (c: string) => void }; shininess?: number };
        material.color.set('#ffffff');
        if ('shininess' in material) material.shininess = 2;

        const controls = globe.controls() as {
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
        controls.minDistance = 160;
        controls.maxDistance = 520;

        globe.pointOfView({ lat: 54, lng: -96, altitude: 1.55 }, 0);

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
          if (!destroyed && globe) {
            globe
              .polygonsData(geo.features)
              .polygonCapColor(() => '#dde6f0')
              .polygonSideColor(() => 'rgba(150,170,195,0.12)')
              .polygonStrokeColor(() => '#c2cedd')
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
      className="mx-auto aspect-square w-full max-w-[600px] cursor-grab touch-none active:cursor-grabbing"
    />
  );
}
