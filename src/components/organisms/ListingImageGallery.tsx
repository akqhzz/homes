'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface ListingImageGalleryProps {
  images: string[];
  address: string;
}

export default function ListingImageGallery({ images, address }: ListingImageGalleryProps) {
  const galleryImages = useMemo(() => {
    if (images.length === 0) return [];
    return Array.from({ length: Math.max(7, images.length) }, (_, index) => images[index % images.length]);
  }, [images]);
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [close, isOpen]);

  if (galleryImages.length === 0) return null;

  return (
    <>
      <section className="grid gap-2 lg:grid-cols-[1.35fr_0.65fr] lg:gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#F5F6F7] text-left lg:aspect-[16/10]"
          aria-label="Open listing image gallery"
        >
          <Image src={galleryImages[0]} alt={address} fill priority className="object-cover transition-transform duration-300 hover:scale-[1.015]" sizes="(min-width: 1024px) 64vw, 100vw" />
        </button>
        <div className="grid grid-cols-2 gap-2 lg:grid-rows-3 lg:gap-3">
          {galleryImages.slice(1, 7).map((image, index) => (
            <button
              type="button"
              key={`${image}-${index}`}
              onClick={() => setIsOpen(true)}
              className={`relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#F5F6F7] text-left lg:aspect-auto ${index > 1 ? 'hidden lg:block' : ''}`}
              aria-label={`Open listing photo ${index + 2}`}
            >
              <Image src={image} alt={`${address} photo ${index + 2}`} fill className="object-cover transition-transform duration-300 hover:scale-[1.02]" sizes="(min-width: 1024px) 16vw, 50vw" />
            </button>
          ))}
        </div>
      </section>

      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-white">
          <button
            type="button"
            onClick={close}
            className="fixed right-4 top-4 z-[110] flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-[#0F1729]/75 backdrop-blur transition-colors hover:bg-white/90 hover:text-[#0F1729]"
            aria-label="Close gallery"
          >
            <X size={18} />
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {galleryImages.map((image, index) => (
              <div key={`${image}-gallery-${index}`} className="relative aspect-[375/305] bg-[#F5F6F7]">
                <Image src={image} alt={`${address} photo ${index + 1}`} fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" priority={index < 2} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
