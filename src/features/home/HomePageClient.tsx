'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Button from '@/components/ui/Button';
import ListingCard from '@/features/listings/components/ListingCard';
import ListingsFooter from '@/features/listings/components/ListingsFooter';
import HeroGlobe from '@/features/home/HeroGlobe';
import { SectionHeader } from '@/features/home/SectionHeader';
import { MarketStatsStrip, MarketBoard, AreaFinder } from '@/features/home/MarketSections';
import { useUIStore } from '@/store/uiStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';

const TORONTO_AVATAR = 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=80&q=80';

const INSIGHTS = [
  {
    title: "Canada's Housing Market Heats Up for Summer, Sales Rise 5.5% in May 2026: CREA",
    date: 'Jun 16, 2026',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=80',
    description:
      'Home sales picked up across most major markets last month as buyers returned, with prices holding steady and new listings climbing.',
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

  const activeListings = MOCK_LISTINGS.filter((l) => l.listingStatus !== 'sold');
  const newest = [...activeListings].sort((a, b) => a.daysOnMarket - b.daysOnMarket).slice(0, 10);
  const featuredListings = [...activeListings].sort((a, b) => b.price - a.price).slice(0, 10);
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

  const newestRef = useRef<HTMLDivElement>(null);
  const soldRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * Math.min(760, ref.current.clientWidth * 0.85), behavior: 'smooth' });

  const [featuredArticle, ...restArticles] = INSIGHTS;

  const renderCarousel = (listings: typeof MOCK_LISTINGS, ref: React.RefObject<HTMLDivElement | null>) => (
    <div
      ref={ref}
      className="mt-3 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 sm:mt-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {listings.map((listing) => (
        <div key={listing.id} className="shrink-0 snap-start">
          <ListingCard
            listing={listing}
            variant="carousel"
            carouselWidth={cardWidth}
            carouselImageHeight={cardImageHeight}
            carouselTotalHeight={cardTotalHeight}
          />
        </div>
      ))}
    </div>
  );

  return (
    <PageShell desktopWide showDesktopHeader={false}>
      <div className="h-full overflow-x-hidden overflow-y-auto bg-white">
        {/* ── Hero with interactive globe ────────────────────── */}
        <section className="relative overflow-hidden bg-[radial-gradient(96%_64%_at_50%_56%,#c7dcf1_0%,#dceafa_44%,#eef5fb_72%,#ffffff_96%)] min-h-[460px] sm:min-h-[560px] lg:bg-[radial-gradient(60%_64%_at_50%_58%,#cfe1f3_0%,#e4eff9_52%,#f4f9fc_74%,#ffffff_94%)] lg:min-h-[640px]">
          {/* Globe fills the hero; the blue glow lives in the background behind it.
              z-0 creates a stacking context so the fade/search bar layer above its pins. */}
          <div className="absolute inset-x-0 -top-[3%] bottom-0 z-0">
            <HeroGlobe />
          </div>

          {/* Tall, soft white fade so the globe's bottom melts smoothly into the page */}
          <div className="pointer-events-none absolute inset-x-0 -bottom-5 z-[5] h-44 bg-gradient-to-t from-white via-white/30 to-transparent lg:h-72" />

          {/* Let swipes/scrolls near the bottom pass to the page */}
          <div className="absolute inset-x-0 bottom-0 top-[82%] z-[6]" />

          {/* Search bar crossing the lower half of the globe (above every pin) */}
          <div className="absolute inset-x-0 top-[74%] z-20 -translate-y-1/2 px-4 sm:px-5">
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

        {/* ── At a glance (Toronto, ON + stats strip) ────────── */}
        <section className="w-full px-5 pt-10 lg:px-12 lg:pt-12">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              onClick={goToMap}
              className="flex min-w-0 items-center gap-2 rounded-full bg-[var(--color-brand-surface)] py-1.5 pl-1.5 pr-3.5 transition-colors hover:bg-[var(--color-brand-surface-strong)] sm:pr-4"
            >
              <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full sm:h-8 sm:w-8">
                <Image src={TORONTO_AVATAR} alt="" fill sizes="32px" className="object-cover" />
              </span>
              <span className="truncate type-heading-sm !text-[1.05rem] text-[var(--color-text-primary)] sm:!text-[1.2rem] lg:!text-[1.35rem]">Toronto, ON</span>
            </button>
            <h2 className="type-title-lg !text-[1.45rem] text-[var(--color-text-primary)] sm:!text-[1.875rem] lg:!text-[2.15rem]">At A Glance</h2>
          </div>
        </section>
        <MarketStatsStrip />

        {/* ── New listings ───────────────────────────────────── */}
        <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
          <SectionHeader
            title="5,400+ New Listings"
            onArrow={goToMap}
            onPrev={() => scrollRow(newestRef, -1)}
            onNext={() => scrollRow(newestRef, 1)}
          />
          {renderCarousel(newest, newestRef)}
        </section>

        {/* ── Market insights dashboard ──────────────────────── */}
        <MarketBoard />

        {/* ── News & Guides ──────────────────────────────────── */}
        <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
          <SectionHeader title="News & Guides" onArrow={() => router.push('/for-you')} />

          {/* Mobile: horizontal carousel, like the listing cards */}
          <div className="mt-3 flex gap-5 overflow-x-auto pb-4 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {INSIGHTS.map((article) => (
              <button key={article.title} className="group flex w-[290px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-[var(--color-border)] text-left">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={article.image} alt="" fill sizes="290px" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="type-heading-sm leading-snug text-[var(--color-text-primary)] line-clamp-3">{article.title}</h3>
                  <p className="mt-auto pt-2 type-caption text-[var(--color-text-tertiary)]">{article.date}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop: featured article + grid */}
          <div className="mt-7 hidden gap-5 sm:grid lg:grid-cols-2">
            <button className="group flex flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] text-left">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image src={featuredArticle.image} alt="" fill sizes="(min-width:1024px) 560px, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="type-title !text-[1.55rem] leading-tight text-[var(--color-text-primary)]">{featuredArticle.title}</h3>
                <p className="mt-auto pt-3 type-caption text-[var(--color-text-tertiary)]">{featuredArticle.date}</p>
              </div>
            </button>

            <div className="grid gap-5 sm:grid-cols-2">
              {restArticles.map((article) => (
                <button key={article.title} className="group flex flex-col overflow-hidden rounded-[20px] border border-[var(--color-border)] text-left">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image src={article.image} alt="" fill sizes="(min-width:1024px) 270px, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
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
          <SectionHeader title="Sold Prices" onArrow={goToMap} onPrev={() => scrollRow(soldRef, -1)} onNext={() => scrollRow(soldRef, 1)} />
          {renderCarousel(soldListings, soldRef)}
        </section>

        {/* ── Find your area (neighbourhoods) ────────────────── */}
        <AreaFinder onSelect={goToMap} />

        {/* ── Featured listings ──────────────────────────────── */}
        <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
          <SectionHeader title="Featured listings" onArrow={goToMap} onPrev={() => scrollRow(featuredRef, -1)} onNext={() => scrollRow(featuredRef, 1)} />
          {renderCarousel(featuredListings, featuredRef)}
        </section>

        {/* ── Footer (matches the map listing view) ──────────── */}
        <div className="mt-14 px-5 pb-28 lg:px-12 lg:pb-6">
          <ListingsFooter fullWidth />
        </div>
      </div>
    </PageShell>
  );
}

