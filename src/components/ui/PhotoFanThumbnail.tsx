'use client';
import type { CSSProperties } from 'react';
import Image from 'next/image';

// Three overlapping photos in a gentle fan. When wrapped in a hovered `.group`
// the photos spread apart a touch (see `.fan-item` in globals.css).
const FAN = [
  { base: 'rotate(-9deg) translate(-7px, 1px)', hover: 'rotate(-17deg) translate(-13px, -1px)', z: 10 },
  { base: 'rotate(9deg) translate(7px, 1px)', hover: 'rotate(17deg) translate(13px, -1px)', z: 10 },
  { base: 'rotate(0deg)', hover: 'rotate(0deg) translate(0, -3px)', z: 20 },
];

export default function PhotoFanThumbnail({ images, className }: { images: string[]; className?: string }) {
  const pics = images.filter(Boolean).slice(0, 3);
  return (
    <span className={`relative h-14 w-14 shrink-0 ${className ?? ''}`}>
      {pics.map((src, i) => (
        <span
          key={i}
          className="fan-item absolute left-1/2 top-1/2 h-9 w-9 overflow-hidden rounded-[9px] border border-white bg-white shadow-[0_1px_4px_rgba(15,23,41,0.12)]"
          style={{ '--fan-base': FAN[i].base, '--fan-hover': FAN[i].hover, zIndex: FAN[i].z } as CSSProperties}
        >
          <Image src={src} alt="" fill sizes="36px" className="object-cover" />
        </span>
      ))}
    </span>
  );
}
