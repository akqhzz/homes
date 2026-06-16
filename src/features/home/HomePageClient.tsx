'use client';
import { useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Map as MapIcon, Search } from 'lucide-react';
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

  const featured = [...MOCK_LISTINGS].sort((a, b) => a.daysOnMarket - b.daysOnMarket).slice(0, 10);
  const soldListings = (() => {
    const sold = MOCK_LISTINGS.filter((l) => l.listingStatus === 'sold');
    return (sold.length >= 5 ? sold : MOCK_LISTINGS.slice(20, 30)).slice(0, 8);
  })();

  const openSearch = () => setActivePanel('search');
  const goToMap = () => router.push('/');

  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * Math.min(720, ref.current.clientWidth * 0.85), behavior: 'smooth' });

  const [featuredArticle, ...restArticles] = INSIGHTS;

  return (
    <PageShell desktopWide showDesktopHeader={false}>
      <div className="h-full overflow-x-hidden overflow-y-auto bg-white">
        {/* ── Hero with interactive globe ────────────────────── */}
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#eaf1f8_0%,#f4f8fb_46%,#ffffff_100%)]">
          <div className="relative flex w-full flex-col items-center px-4 pb-16 pt-6 sm:px-5 lg:px-12 lg:pb-20 lg:pt-10">
            <HeroGlobe />

            {/* Search bar overlapping the globe */}
            <div className="relative z-10 -mt-14 w-full max-w-[760px] sm:-mt-24 lg:-mt-28">
              <div className="flex items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-[0_6px_20px_rgba(15,23,41,0.07)] ring-1 ring-[var(--color-border)]/60 sm:p-2.5 sm:pl-7">
                <Search size={20} className="hidden shrink-0 text-[var(--color-text-tertiary)] sm:block" />
                <button
                  onClick={openSearch}
                  className="min-w-0 flex-1 truncate py-3 text-left text-[0.95rem] text-[var(--color-text-tertiary)] sm:py-4 sm:text-[1.05rem]"
                >
                  Enter a city, neighbourhood, address, MLS® number or school
                </button>
                <Button shape="circle" size="lg" onClick={openSearch} aria-label="Search" className="h-11 w-11 shrink-0 sm:h-14 sm:w-14">
                  <Search size={20} />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Listings carousel ──────────────────────────────── */}
        <section className="w-full px-5 pt-12 lg:px-12 lg:pt-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="type-title !text-[1.3rem] text-[var(--color-text-primary)] sm:!text-[1.5rem]">5,400+ listings in</h2>
              <button
                onClick={openSearch}
                className="flex items-center gap-2 rounded-full bg-[var(--color-surface)] py-1.5 pl-1.5 pr-3 transition-colors hover:bg-[var(--color-surface-hover)]"
              >
                <span className="relative h-7 w-7 overflow-hidden rounded-full">
                  <Image src={TORONTO_AVATAR} alt="" fill sizes="28px" className="object-cover" />
                </span>
                <span className="type-heading-sm text-[var(--color-text-primary)]">Toronto, ON</span>
                <ChevronDown size={16} className="text-[var(--color-text-secondary)]" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 sm:flex">
                <CarouselArrow direction="left" onClick={() => scrollRow(listingsRef, -1)} />
                <CarouselArrow direction="right" onClick={() => scrollRow(listingsRef, 1)} />
              </div>
              <Button variant="surface" size="md" onClick={goToMap} className="gap-1.5 type-label">
                <MapIcon size={16} />
                Map View
              </Button>
            </div>
          </div>

          <div
            ref={listingsRef}
            className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {featured.map((listing) => (
              <div key={listing.id} className="w-[288px] shrink-0 snap-start">
                <ListingCard listing={listing} variant="carousel" />
              </div>
            ))}
          </div>
        </section>

        {/* ── Market Insights ────────────────────────────────── */}
        <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
          <div className="flex items-center justify-between gap-4">
            <h2 className="type-title-lg !text-[1.45rem] text-[var(--color-text-primary)] sm:!text-[1.875rem]">Market Insights</h2>
            <Button variant="surface" size="md" className="hidden gap-1.5 type-label sm:flex">
              Read more
              <ArrowRight size={16} />
            </Button>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
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
              <h2 className="type-title-lg !text-[1.45rem] text-[var(--color-text-primary)] sm:!text-[1.875rem]">Sold Prices</h2>
              <p className="mt-1.5 type-body text-[var(--color-text-secondary)]">Search sold data from 2003 – 2026.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 sm:flex">
                <CarouselArrow direction="left" onClick={() => scrollRow(soldRef, -1)} />
                <CarouselArrow direction="right" onClick={() => scrollRow(soldRef, 1)} />
              </div>
              <Button variant="surface" size="md" onClick={goToMap} className="type-label">
                View sold properties
              </Button>
            </div>
          </div>

          <div
            ref={soldRef}
            className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {soldListings.map((listing) => (
              <div key={listing.id} className="w-[288px] shrink-0 snap-start">
                <ListingCard listing={listing} variant="carousel" />
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer (matches the map listing view) ──────────── */}
        <div className="mt-14 px-5 pb-28 lg:px-12 lg:pb-6">
          <ListingsFooter />
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
