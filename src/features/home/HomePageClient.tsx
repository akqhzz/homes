'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight, Map as MapIcon, Search } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Button from '@/components/ui/Button';
import ListingCard from '@/features/listings/components/ListingCard';
import ListingsFooter from '@/features/listings/components/ListingsFooter';
import HeroGlobe from '@/features/home/HeroGlobe';
import { useUIStore } from '@/store/uiStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { cn } from '@/lib/utils/cn';

const TORONTO_AVATAR = 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=80&q=80';

const INSIGHTS = [
  {
    title: "Canada's Housing Market Heats Up for Summer, Sales Rise 5.5% in May 2026: CREA",
    date: 'Jun 16, 2026',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=80',
    featured: true,
  },
  {
    title: 'Do You Have Over $100K for a Down Payment? What It Takes to Own a Detached Home',
    date: 'Jun 15, 2026',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
  },
  {
    title: '7 Vacation Home Markets Where Inventory Is Finally Up in 2026',
    date: 'Jun 14, 2026',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=80',
  },
  {
    title: '10 LGBTQ-Friendly Cities Where You Can Still Buy a Home Under $400K in 2026',
    date: 'Jun 13, 2026',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
  },
  {
    title: 'Are Spider Plants Poisonous to Dogs? A First-Time Owner’s Guide to Pet-Safe Greenery',
    date: 'Jun 12, 2026',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=80',
  },
];

export default function HomePageClient() {
  const router = useRouter();
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const listingsRef = useRef<HTMLDivElement>(null);
  const soldRef = useRef<HTMLDivElement>(null);

  const featured = [...MOCK_LISTINGS]
    .filter((l) => l.listingStatus !== 'sold')
    .sort((a, b) => a.daysOnMarket - b.daysOnMarket)
    .slice(0, 10);
  const soldListings = (() => {
    const sold = MOCK_LISTINGS.filter((l) => l.listingStatus === 'sold');
    return (sold.length >= 5 ? sold : MOCK_LISTINGS.slice(20, 30)).slice(0, 8);
  })();

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const cardWidth = isDesktop ? 352 : 300;
  const cardImageHeight = isDesktop ? 212 : 190;
  const cardTotalHeight = isDesktop ? 302 : 278;

  const openSearch = () => setActivePanel('search');
  const goToMap = () => router.push('/');

  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * Math.min(720, ref.current.clientWidth * 0.85), behavior: 'smooth' });

  const [featuredArticle, ...restArticles] = INSIGHTS;

  return (
    <PageShell desktopWide showDesktopHeader={false}>
      <div className="h-full overflow-x-hidden overflow-y-auto bg-white">
        {/* ── Hero with interactive globe ────────────────────── */}
        <section className="relative overflow-hidden bg-[radial-gradient(96%_62%_at_50%_38%,#c7dcf1_0%,#dceafa_40%,#eef5fb_64%,#ffffff_84%)] min-h-[460px] sm:min-h-[560px] lg:bg-[radial-gradient(58%_60%_at_50%_42%,#cfe1f3_0%,#e4eff9_48%,#ffffff_82%)] lg:min-h-[640px]">
          {/* Globe fills the hero; the blue glow lives in the background behind it */}
          <div className="absolute inset-0 translate-y-[4%]">
            <HeroGlobe />
          </div>

          {/* Soft white fade so the globe's bottom edge isn't a hard cut */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-32 bg-gradient-to-t from-white via-white/80 to-transparent lg:h-44" />

          {/* Below the interactive zone, let swipes/scrolls pass to the page
              instead of rotating the globe (the globe still shows through) */}
          <div className="absolute inset-x-0 bottom-0 top-[56%] z-[6]" />

          {/* Search bar crossing the lower half of the globe */}
          <div className="absolute inset-x-0 top-[74%] z-10 -translate-y-1/2 px-4 sm:px-5">
            <div className="mx-auto w-full max-w-[760px]">
              <div className="flex items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-[0_6px_20px_rgba(15,23,41,0.07)] ring-1 ring-[var(--color-border)]/60 sm:p-3 sm:pl-8">
                <Search size={22} className="hidden shrink-0 text-[var(--color-text-tertiary)] sm:block" />
                <button
                  onClick={openSearch}
                  className="min-w-0 flex-1 truncate py-5 text-left text-[1rem] text-[var(--color-text-tertiary)] sm:py-[1.4rem] sm:text-[1.1rem]"
                >
                  Enter a city, neighbourhood, address, MLS® number or school
                </button>
                <Button shape="circle" size="lg" onClick={openSearch} aria-label="Search" className="h-12 w-12 shrink-0 sm:h-[3.4rem] sm:w-[3.4rem]">
                  <Search size={20} />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Listings carousel ──────────────────────────────── */}
        <section className="w-full px-5 pt-3 lg:px-12 lg:pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="type-title !text-[1.3rem] text-[var(--color-text-primary)] sm:!text-[1.5rem] lg:!text-[1.75rem]">5,400+ listings in</h2>
              <button
                onClick={goToMap}
                className="flex items-center gap-2 rounded-full bg-[var(--color-brand-surface)] py-1.5 pl-1.5 pr-4 transition-colors hover:bg-[var(--color-brand-surface-strong)]"
              >
                <span className="relative h-8 w-8 overflow-hidden rounded-full">
                  <Image src={TORONTO_AVATAR} alt="" fill sizes="32px" className="object-cover" />
                </span>
                <span className="type-heading-sm !text-[1.2rem] text-[var(--color-brand-text)] lg:!text-[1.35rem]">Toronto, ON</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 sm:flex">
                <CarouselArrow direction="left" onClick={() => scrollRow(listingsRef, -1)} />
                <CarouselArrow direction="right" onClick={() => scrollRow(listingsRef, 1)} />
              </div>
              <Button variant="secondary" size="md" onClick={goToMap} className="hidden gap-1.5 type-label sm:flex">
                <MapIcon size={16} />
                Map View
              </Button>
            </div>
          </div>

          <div
            ref={listingsRef}
            className="mt-3 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 sm:mt-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {featured.map((listing) => (
              <div key={listing.id} className="shrink-0 snap-start">
                <ListingCard listing={listing} variant="carousel" carouselWidth={cardWidth} carouselImageHeight={cardImageHeight} carouselTotalHeight={cardTotalHeight} />
              </div>
            ))}
          </div>

          <div className="mt-2 flex justify-center sm:hidden">
            <Button variant="secondary" size="md" onClick={goToMap} className="gap-1.5 type-label">
              <MapIcon size={16} />
              Map View
            </Button>
          </div>
        </section>

        {/* ── Market Insights ────────────────────────────────── */}
        <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
          <div className="flex items-center justify-between gap-4">
            <h2 className="type-title-lg !text-[1.45rem] text-[var(--color-text-primary)] sm:!text-[1.875rem] lg:!text-[2.15rem]">Market Insights</h2>
            <Button variant="surface" size="md" className="hidden gap-1.5 type-label sm:flex">
              Read more
              <ArrowRight size={16} />
            </Button>
          </div>

          <div className="mt-4 grid gap-5 sm:mt-7 lg:grid-cols-2">
            {/* Featured article */}
            <button className="group flex flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] text-left">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={featuredArticle.image}
                  alt=""
                  fill
                  sizes="(min-width:1024px) 560px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="type-subtitle text-[var(--color-text-primary)]">{featuredArticle.title}</h3>
                <p className="mt-2 type-caption text-[var(--color-text-tertiary)]">{featuredArticle.date}</p>
              </div>
            </button>

            {/* 2x2 grid of smaller articles */}
            <div className="grid gap-5 sm:grid-cols-2">
              {restArticles.map((article) => (
                <button key={article.title} className="group flex flex-col overflow-hidden rounded-[20px] border border-[var(--color-border)] text-left">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={article.image}
                      alt=""
                      fill
                      sizes="(min-width:1024px) 270px, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="type-heading-sm leading-snug text-[var(--color-text-primary)] line-clamp-3">{article.title}</h3>
                    <p className="mt-auto pt-2 type-caption text-[var(--color-text-tertiary)]">{article.date}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Sold Prices ────────────────────────────────────── */}
        <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="type-title-lg !text-[1.45rem] text-[var(--color-text-primary)] sm:!text-[1.875rem] lg:!text-[2.15rem]">Sold Prices</h2>
              <p className="mt-1.5 type-body text-[var(--color-text-secondary)]">Search sold data from 2003 – 2026.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 sm:flex">
                <CarouselArrow direction="left" onClick={() => scrollRow(soldRef, -1)} />
                <CarouselArrow direction="right" onClick={() => scrollRow(soldRef, 1)} />
              </div>
              <Button variant="secondary" size="md" onClick={goToMap} className="hidden type-label sm:flex">
                View sold properties
              </Button>
            </div>
          </div>

          <div
            ref={soldRef}
            className="mt-3 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 sm:mt-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {soldListings.map((listing) => (
              <div key={listing.id} className="shrink-0 snap-start">
                <ListingCard listing={listing} variant="carousel" carouselWidth={cardWidth} carouselImageHeight={cardImageHeight} carouselTotalHeight={cardTotalHeight} />
              </div>
            ))}
          </div>

          <div className="mt-2 flex justify-center sm:hidden">
            <Button variant="secondary" size="md" onClick={goToMap} className="type-label">
              View sold properties
            </Button>
          </div>
        </section>

        {/* ── Footer (matches the map listing view) ──────────── */}
        <div className="mt-14 px-5 pb-28 lg:px-12 lg:pb-6">
          <ListingsFooter fullWidth />
        </div>
      </div>
    </PageShell>
  );
}

function CarouselArrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous' : 'Next'}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]'
      )}
    >
      <Icon size={18} />
    </button>
  );
}
