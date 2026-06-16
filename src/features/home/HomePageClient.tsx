'use client';
import { useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, LogIn, Map as MapIcon, Search } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Button from '@/components/ui/Button';
import ListingCard from '@/features/listings/components/ListingCard';
import HeroGlobe from '@/features/home/HeroGlobe';
import { useUIStore } from '@/store/uiStore';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { cn } from '@/lib/utils/cn';

const TORONTO_AVATAR = 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=80&q=80';

const NAV_LINKS = ['Buy', 'Rent', 'Sell'] as const;

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

const FOOTER_COLUMNS = [
  {
    title: 'Popular Cities',
    links: ['Toronto Real Estate', 'Vancouver Real Estate', 'Calgary Real Estate', 'Edmonton Real Estate', 'Ottawa Real Estate', 'Mississauga Real Estate', 'Winnipeg Real Estate', 'Hamilton Real Estate', 'Brampton Real Estate', 'London Real Estate'],
  },
  {
    title: 'Condos for Sale in Canada',
    links: ['Toronto Condos for Sale', 'Vancouver Condos for Sale', 'Calgary Condos for Sale', 'Ottawa Condos for Sale', 'Mississauga Condos for Sale', 'Brampton Condos for Sale', 'Hamilton Condos for Sale', 'London Condos for Sale', 'Halifax Condos for Sale', 'Victoria Condos for Sale'],
  },
  {
    title: 'Popular Ontario Cities',
    links: ['Toronto Homes for Sale', 'Ottawa Homes for Sale', 'Mississauga Homes for Sale', 'Brampton Homes for Sale', 'Hamilton Homes for Sale', 'London Homes for Sale', 'Vaughan Homes for Sale', 'Markham Homes for Sale', 'Kitchener Homes for Sale', 'Oakville Homes for Sale'],
  },
  {
    title: 'Popular Searches',
    links: ['MLS® Listings in Canada', 'Houses for Sale in Canada', 'First-Time Home Buyer', 'Sold Prices in Canada', 'Real Estate Market Trends', 'Calgary Houses for Sale', 'Toronto Rentals', 'Pre-Construction Homes', 'New Houses for Sale', 'Luxury Homes in Toronto'],
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
      <div className="h-full overflow-y-auto bg-white">
        {/* ── Hero with interactive globe ────────────────────── */}
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#eaf1f8_0%,#f4f8fb_46%,#ffffff_100%)]">
          {/* Top nav row */}
          <div className="mx-auto flex max-w-[1180px] items-center justify-end gap-1 px-5 pt-5 lg:px-8">
            <nav className="hidden items-center gap-1 sm:flex">
              {NAV_LINKS.map((link) => (
                <button
                  key={link}
                  onClick={goToMap}
                  className="flex items-center gap-1 rounded-full px-3.5 py-2 type-label text-[var(--color-text-primary)] transition-colors hover:bg-white/70"
                >
                  {link}
                  <ChevronDown size={15} className="text-[var(--color-text-tertiary)]" />
                </button>
              ))}
            </nav>
            <button className="ml-1 flex items-center gap-1.5 rounded-full px-3.5 py-2 type-label text-[var(--color-text-primary)] transition-colors hover:bg-white/70">
              <LogIn size={16} />
              Login
            </button>
          </div>

          <div className="relative mx-auto flex max-w-[1180px] flex-col items-center px-5 pb-24 pt-2 lg:px-8">
            <HeroGlobe />

            {/* Search bar overlapping the globe */}
            <div className="relative z-10 -mt-20 w-full max-w-[720px] lg:-mt-24">
              <div className="flex items-center gap-2 rounded-full bg-white p-2 pl-6 shadow-[0_20px_50px_-12px_rgba(43,82,107,0.4),0_4px_14px_rgba(15,23,41,0.08)]">
                <Search size={20} className="hidden shrink-0 text-[var(--color-text-tertiary)] sm:block" />
                <button
                  onClick={openSearch}
                  className="min-w-0 flex-1 truncate py-2.5 text-left type-body-lg text-[var(--color-text-tertiary)]"
                >
                  Enter a city, neighbourhood, address, MLS® number or school
                </button>
                <Button shape="circle" size="lg" onClick={openSearch} aria-label="Search" className="shrink-0">
                  <Search size={20} />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Listings carousel ──────────────────────────────── */}
        <section className="mx-auto max-w-[1180px] px-5 pt-12 lg:px-8 lg:pt-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="type-title text-[var(--color-text-primary)]">5,400+ listings in</h2>
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
        <section className="mx-auto max-w-[1180px] px-5 pt-14 lg:px-8 lg:pt-20">
          <div className="flex items-center justify-between gap-4">
            <h2 className="type-title-lg text-[var(--color-text-primary)]">Market Insights</h2>
            <Button variant="surface" size="md" className="gap-1.5 type-label">
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
        <section className="mx-auto max-w-[1180px] px-5 pt-14 lg:px-8 lg:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="type-title-lg text-[var(--color-text-primary)]">Sold Prices</h2>
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

        {/* ── Footer link directory ──────────────────────────── */}
        <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="mx-auto max-w-[1180px] px-5 pb-28 pt-12 lg:px-8 lg:pb-14">
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.title}>
                  <p className="type-label text-[var(--color-text-primary)]">{column.title}</p>
                  <ul className="mt-4 flex flex-col gap-3">
                    {column.links.map((link) => (
                      <li key={link}>
                        <button
                          onClick={goToMap}
                          className="text-left type-body text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-brand-700)]"
                        >
                          {link}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-7 sm:flex-row">
              <span className="relative h-5 w-28">
                <Image src="/icons/zoocasa-black.svg" alt="Zoocasa" fill sizes="112px" className="object-contain object-left" />
              </span>
              <p className="type-caption text-[var(--color-text-tertiary)]">© 2026 Homes. Demo project — not affiliated with Zoocasa.</p>
            </div>
          </div>
        </footer>
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
