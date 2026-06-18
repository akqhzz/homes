'use client';
import Image from 'next/image';

// Three overlapping photos in a gentle fan. When wrapped in a hovered `.group`
// the photos spread apart a touch. Transforms live in literal Tailwind
// arbitrary-value classes (base + group-hover) so the scanner generates them
// and the resting/spread states animate via `transition-transform`.
const FAN = [
  'z-10 [transform:translate(-50%,-50%)_rotate(-9deg)_translate(-7px,1px)] group-hover:[transform:translate(-50%,-50%)_rotate(-18deg)_translate(-14px,-1px)]',
  'z-10 [transform:translate(-50%,-50%)_rotate(9deg)_translate(7px,1px)] group-hover:[transform:translate(-50%,-50%)_rotate(18deg)_translate(14px,-1px)]',
  'z-20 [transform:translate(-50%,-50%)] group-hover:[transform:translate(-50%,-50%)_translate(0,-3px)]',
];

export default function PhotoFanThumbnail({ images, className }: { images: string[]; className?: string }) {
  const pics = images.filter(Boolean).slice(0, 3);
  return (
    <span className={`relative h-16 w-16 shrink-0 ${className ?? ''}`}>
      {pics.map((src, i) => (
        <span
          key={i}
          className={`absolute left-1/2 top-1/2 h-10 w-10 overflow-hidden rounded-[10px] border border-white bg-white shadow-[0_1px_4px_rgba(15,23,41,0.12)] transition-transform duration-[400ms] ease-out ${FAN[i]}`}
        >
          <Image src={src} alt="" fill sizes="40px" className="object-cover" />
        </span>
      ))}
    </span>
  );
}
