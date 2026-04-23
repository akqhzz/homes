'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ListingImageGalleryProps {
  images: string[];
  address: string;
}

export default function ListingImageGallery({ images, address }: ListingImageGalleryProps) {
  const galleryImages = useMemo(() => {
    if (images.length === 0) return [];
    return Array.from({ length: Math.max(5, images.length) }, (_, index) => images[index % images.length]);
  }, [images]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const showPrevious = useCallback(() => {
    setActiveIndex((index) => {
      if (index === null) return index;
      return (index - 1 + galleryImages.length) % galleryImages.length;
    });
  }, [galleryImages.length]);
  const showNext = useCallback(() => {
    setActiveIndex((index) => {
      if (index === null) return index;
      return (index + 1) % galleryImages.length;
    });
  }, [galleryImages.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') showPrevious();
      if (event.key === 'ArrowRight') showNext();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, close, galleryImages.length, showNext, showPrevious]);

  if (galleryImages.length === 0) return null;

  return (
    <>
      <section className="grid gap-2 lg:grid-cols-[1.35fr_0.65fr] lg:gap-3">
        <button
          type="button"
          onClick={() => setActiveIndex(0)}
          className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#F5F6F7] text-left lg:aspect-[16/10]"
          aria-label="Open listing image gallery"
        >
          <Image src={galleryImages[0]} alt={address} fill priority className="object-cover transition-transform duration-300 hover:scale-[1.015]" sizes="(min-width: 1024px) 64vw, 100vw" />
        </button>
        <div className="grid grid-cols-2 gap-2 lg:gap-3">
          {galleryImages.slice(1, 5).map((image, index) => (
            <button
              type="button"
              key={`${image}-${index}`}
              onClick={() => setActiveIndex(index + 1)}
              className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#F5F6F7] text-left lg:aspect-auto"
              aria-label={`Open listing photo ${index + 2}`}
            >
              <Image src={image} alt={`${address} photo ${index + 2}`} fill className="object-cover transition-transform duration-300 hover:scale-[1.02]" sizes="(min-width: 1024px) 16vw, 50vw" />
            </button>
          ))}
        </div>
      </section>

      {activeIndex !== null && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#0F1729] text-white">
          <div className="flex h-16 shrink-0 items-center justify-between px-4 lg:px-6">
            <div>
              <p className="type-label text-white">{address}</p>
              <p className="mt-0.5 type-caption text-white/60">{activeIndex + 1} / {galleryImages.length}</p>
            </div>
            <button
              type="button"
              onClick={close}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close gallery"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-5 lg:px-16">
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 lg:left-6"
              aria-label="Previous photo"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="relative h-full max-h-[calc(100dvh-8.5rem)] w-full max-w-6xl overflow-hidden rounded-3xl bg-white/5">
              <Image src={galleryImages[activeIndex]} alt={`${address} gallery photo`} fill className="object-contain" sizes="100vw" priority />
            </div>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 lg:right-6"
              aria-label="Next photo"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="hidden shrink-0 gap-2 overflow-x-auto px-6 pb-5 lg:flex">
            {galleryImages.map((image, index) => (
              <button
                type="button"
                key={`${image}-thumb-${index}`}
                onClick={() => setActiveIndex(index)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl transition ${index === activeIndex ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'}`}
                aria-label={`Show photo ${index + 1}`}
              >
                <Image src={image} alt="" fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
