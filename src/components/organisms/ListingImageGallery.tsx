'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
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
  const galleryScrollRef = useRef<HTMLDivElement | null>(null);
  const gallerySwipeStartRef = useRef<{ x: number; y: number; atTop: boolean } | null>(null);

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

  const handleGalleryTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    gallerySwipeStartRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      atTop: (galleryScrollRef.current?.scrollTop ?? 0) <= 2,
    };
  };

  const handleGalleryTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = gallerySwipeStartRef.current;
    if (!start?.atTop) return;
    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (dy > 8 && Math.abs(dy) > Math.abs(dx) * 1.1) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleGalleryTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = gallerySwipeStartRef.current;
    gallerySwipeStartRef.current = null;
    if (!start?.atTop) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (dy > 58 && Math.abs(dy) > Math.abs(dx) * 1.1) close();
  };

  return (
    <>
      <section className="grid gap-2 lg:grid-cols-[1.35fr_0.65fr] lg:gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#F5F6F7] text-left lg:aspect-[16/8.8]"
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
              className={`relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#F5F6F7] text-left lg:aspect-[4/3] ${index > 1 ? 'hidden lg:block' : ''}`}
              aria-label={`Open listing photo ${index + 2}`}
            >
              <Image src={image} alt={`${address} photo ${index + 2}`} fill className="object-cover transition-transform duration-300 hover:scale-[1.02]" sizes="(min-width: 1024px) 16vw, 50vw" />
              {index === 1 && (
                <span className="absolute bottom-2.5 right-2.5 inline-flex h-7 items-center rounded-full bg-white/88 px-2.5 type-caption text-[#0F1729] shadow-[0_6px_18px_rgba(15,23,41,0.14)] backdrop-blur lg:hidden">
                  View {galleryImages.length} Images
                </span>
              )}
              {index === 5 && (
                <span className="absolute bottom-2.5 right-2.5 hidden h-7 items-center rounded-full bg-white/88 px-2.5 type-caption text-[#0F1729] shadow-[0_6px_18px_rgba(15,23,41,0.14)] backdrop-blur lg:inline-flex">
                  View {galleryImages.length} Images
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] bg-white"
            initial={{ y: 36, opacity: 0.98 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 1, scale: 1 }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={close}
              className="fixed right-4 top-4 z-[110] flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-[#0F1729]/70 backdrop-blur transition-colors hover:bg-white/70 hover:text-[#0F1729]"
              aria-label="Close gallery"
            >
              <X size={16} />
            </button>
            <div
              ref={galleryScrollRef}
              className="h-full overflow-y-auto"
              onTouchStart={handleGalleryTouchStart}
              onTouchMove={handleGalleryTouchMove}
              onTouchEnd={handleGalleryTouchEnd}
              style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {galleryImages.map((image, index) => (
                  <div key={`${image}-gallery-${index}`} className="relative aspect-[375/305] bg-[#F5F6F7]">
                    <Image src={image} alt={`${address} photo ${index + 1}`} fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" priority={index < 2} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
