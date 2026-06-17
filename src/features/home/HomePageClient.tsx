'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Button from '@/components/ui/Button';
import ListingCard from '@/features/listings/components/ListingCard';
import ListingsFooter from '@/features/listings/components/ListingsFooter';
import HeroGlobe from '@/features/home/HeroGlobe';
import { SectionHeader } from '@/features/home/SectionHeader';
import { MarketStatsStrip, MarketBoard, DeepDive, AreaFinder, CITY, getCityData, cityImageUrl } from '@/features/home/MarketSections';
import { useUIStore } from '@/store/uiStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';

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

  // The selected city drives every section's copy + numbers. Clicking a city
  // pin on the globe sets it (instead of navigating to the map).
  const [city, setCity] = useState(CITY);
  const cityData = getCityData(city);

  const activeListings = MOCK_LISTINGS.filter((l) => l.listingStatus !== 'sold');
  const baseNewest = [...activeListings].sort((a, b) => a.daysOnMarket - b.daysOnMarket).slice(0, 10);
  // Rotate each card's photos by a per-city offset so the new-listings row
  // looks different for each city (we only have one real listing set).
  const newest = baseNewest.map((l, i) => {
    const imgs = l.images ?? [];
    const k = imgs.length ? (cityData.imageOffset + i) % imgs.length : 0;
    return imgs.length ? { ...l, images: [...imgs.slice(k), ...imgs.slice(0, k)] } : l;
  });
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
        <div key={listing.id} className="shrink-0 snap-start cursor-pointer rounded-2xl transition-transform hover:-translate-y-0.5">
          <ListingCard
            listing={listing}
            variant="carousel"
            carouselScrollPriority
            carouselWidth={cardWidth}
            carouselImageHeight={cardImageHeight}
            carouselTotalHeight={cardTotalHeight}
          />
        </div>
      ))}
      <ViewAllCard
        images={listings.slice(0, 3).map((l) => l.images?.[0]).filter((s): s is string => Boolean(s))}
        total={cityData.active}
        width={cardWidth}
        height={cardTotalHeight}
        onClick={goToMap}
      />
    </div>
  );

  return (
    <PageShell desktopWide showDesktopHeader={false}>
      <div className="h-full overflow-x-hidden overflow-y-auto bg-white">
        {/* ── Hero with interactive globe ────────────────────── */}
        <section className="relative overflow-hidden bg-[radial-gradient(96%_64%_at_50%_56%,#c7dcf1_0%,#dceafa_44%,#eef5fb_72%,#ffffff_96%)] min-h-[420px] sm:min-h-[510px] lg:bg-[radial-gradient(60%_64%_at_50%_58%,#cfe1f3_0%,#e4eff9_52%,#f4f9fc_74%,#ffffff_94%)] lg:min-h-[580px]">
          {/* Globe fills the hero; the blue glow lives in the background behind it.
              z-0 creates a stacking context so the fade/search bar layer above its pins. */}
          <div className="absolute inset-x-0 -top-[3%] bottom-0 z-0">
            <HeroGlobe onCityClick={setCity} />
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

        {/* City-dependent content re-animates whenever the selected city changes */}
        <motion.div
          key={city}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.15, ease: [0.4, 0, 0.2, 1] }}
        >
        {/* ── At a glance (city + stats strip) ───────────────── */}
        <section className="w-full px-5 pt-3 lg:px-12 lg:pt-5">
          <div className="flex items-center gap-3">
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--color-border)] sm:h-9 sm:w-9">
              <Image src={cityImageUrl(city)} alt="" fill sizes="36px" className="object-cover" />
            </span>
            <h2 className="type-title-lg !text-[1.3rem] text-[var(--color-text-primary)] sm:!text-[1.55rem] lg:!text-[1.8rem]">
              {city} At A Glance
            </h2>
          </div>
        </section>
        <MarketStatsStrip city={city} />

        {/* ── New listings ───────────────────────────────────── */}
        <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
          <SectionHeader
            title={`${cityData.newListingsLabel} New Listings in ${city}`}
            cityImage={cityImageUrl(city)}
            onArrow={goToMap}
            onPrev={() => scrollRow(newestRef, -1)}
            onNext={() => scrollRow(newestRef, 1)}
          />
          {renderCarousel(newest, newestRef)}
        </section>

        {/* ── Market insights dashboard + deep dive ──────────── */}
        <MarketBoard city={city} />
        <DeepDive city={city} />

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
          <SectionHeader title={`Sold Prices in ${city}`} cityImage={cityImageUrl(city)} onArrow={goToMap} onPrev={() => scrollRow(soldRef, -1)} onNext={() => scrollRow(soldRef, 1)} />
          {renderCarousel(soldListings, soldRef)}
        </section>

        {/* ── Find your area (neighbourhoods) ────────────────── */}
        <AreaFinder city={city} onSelect={goToMap} />

        {/* ── Featured listings ──────────────────────────────── */}
        <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
          <SectionHeader title={`Featured Listings in ${city}`} cityImage={cityImageUrl(city)} onArrow={goToMap} onPrev={() => scrollRow(featuredRef, -1)} onNext={() => scrollRow(featuredRef, 1)} />
          {renderCarousel(featuredListings, featuredRef)}
        </section>
        </motion.div>

        {/* ── Footer (matches the map listing view) ──────────── */}
        <div className="mt-14 px-5 pb-28 lg:px-12 lg:pb-6">
          <ListingsFooter fullWidth />
        </div>
      </div>
    </PageShell>
  );
}

// Trailing carousel card: a stack of photos + "See all <count>" → the map.
// Matches the listing-card chrome (white, softly elevated, lifts on hover);
// the photo stack fans out on hover.
function ViewAllCard({ images, total, width, height, onClick }: { images: string[]; total: number; width: number; height: number; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  const pics = images.slice(0, 3);
  const base = ['rotate(-5deg) translate(-20px,2px)', 'rotate(5deg) translate(20px,2px)', 'rotate(0deg) translate(0,0)'];
  const fan = ['rotate(-13deg) translate(-64px,4px)', 'rotate(13deg) translate(64px,4px)', 'rotate(0deg) translate(0,-8px) scale(1.05)'];
  const z = [10, 10, 20];
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`See all ${total.toLocaleString()} listings`}
      className="group shrink-0 snap-start cursor-pointer rounded-2xl transition-transform hover:-translate-y-0.5"
      style={{ width }}
    >
      <div
        className="flex flex-col items-center justify-center rounded-[24px] bg-white shadow-[0_6px_24px_rgba(15,23,41,0.10)] ring-1 ring-[var(--color-border)]/45 transition-shadow group-hover:shadow-[0_14px_34px_rgba(15,23,41,0.16)]"
        style={{ height }}
      >
        <div className="relative h-[150px] w-[224px]">
          {pics.map((src, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-2 h-[120px] w-[120px] overflow-hidden rounded-2xl border-[3px] border-white bg-white shadow-[0_10px_22px_rgba(15,23,41,0.18)]"
              style={{ transform: `translateX(-50%) ${hover ? fan[i] : base[i]}`, zIndex: z[i], transition: 'transform 380ms cubic-bezier(0.22,1,0.36,1)' }}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </div>
          ))}
        </div>
        <span className="mt-5 type-heading text-[var(--color-text-primary)]">See all {total.toLocaleString()}</span>
      </div>
    </button>
  );
}

