'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, Heart, MapPin, Search, ShieldCheck, Sparkles } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Button from '@/components/ui/Button';
import ListingCard from '@/features/listings/components/ListingCard';
import { useUIStore } from '@/store/uiStore';
import { MOCK_LISTINGS, MOCK_NEIGHBORHOODS } from '@/lib/mock-data';
import { formatAvgPrice } from '@/lib/utils/format';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80';

const QUICK_LINKS = [
  { label: 'Buy', sublabel: 'Homes for sale' },
  { label: 'Rent', sublabel: 'Places to lease' },
  { label: 'Sold', sublabel: 'Recent sales' },
] as const;

const VALUE_PROPS = [
  {
    icon: MapPin,
    title: 'Explore on the map',
    body: 'Draw your own search area and browse every active listing across the Greater Toronto Area.',
  },
  {
    icon: Heart,
    title: 'Save to collections',
    body: 'Organize the homes you love into shareable collections and pick up right where you left off.',
  },
  {
    icon: Sparkles,
    title: 'Insights that matter',
    body: 'Track neighbourhood trends and pricing so you always know what a home is really worth.',
  },
];

const FOOTER_COLUMNS = [
  { title: 'Buy', links: ['Houses for Sale', 'Condos for Sale', 'Townhouses', 'Open Houses', 'New Construction'] },
  { title: 'Rent', links: ['Houses for Rent', 'Condos for Rent', 'Townhouses', 'New Rentals'] },
  { title: 'Sell', links: ['Home Appraisal', 'Recently Sold', 'Sell with Zoocasa'] },
  { title: 'Company', links: ['About Us', 'Careers', 'Newsletter', 'Accessibility'] },
];

export default function HomePageClient() {
  const router = useRouter();
  const setActivePanel = useUIStore((s) => s.setActivePanel);

  const featuredListings = [...MOCK_LISTINGS].sort((a, b) => a.daysOnMarket - b.daysOnMarket).slice(0, 8);
  const neighborhoods = MOCK_NEIGHBORHOODS.slice(0, 8);

  const openSearch = () => setActivePanel('search');
  const goToMap = () => router.push('/');

  return (
    <PageShell desktopWide showDesktopHeader={false}>
      <div className="h-full overflow-y-auto bg-white">
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,41,0.55),rgba(15,23,41,0.35)_45%,rgba(15,23,41,0.7))]" />
          </div>

          <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-5 pb-16 pt-20 text-center lg:px-8 lg:pb-24 lg:pt-28">
            <span className="rounded-full bg-white/15 px-3.5 py-1.5 type-caption font-medium uppercase tracking-[0.14em] text-white backdrop-blur-md">
              Greater Toronto Area
            </span>
            <h1 className="mt-6 max-w-3xl type-hero text-white lg:text-[3.25rem] lg:leading-[1.05]">
              Find a place you&apos;ll love to call home
            </h1>
            <p className="mt-4 max-w-xl type-body-lg text-white/85">
              Search homes, condos and townhouses across the GTA — with the map, collections and insights to help you decide.
            </p>

            {/* Search bar — opens the same search panel used across the app */}
            <div className="mt-8 flex w-full max-w-[640px] flex-col gap-2.5 sm:flex-row">
              <button
                onClick={openSearch}
                className="flex min-h-[56px] flex-1 items-center gap-3 rounded-full bg-white px-5 text-left shadow-[var(--shadow-lg)] transition-shadow hover:shadow-[var(--shadow-xl)]"
              >
                <Search size={20} className="shrink-0 text-[var(--color-text-tertiary)]" />
                <span className="min-w-0 flex-1 truncate type-body-lg text-[var(--color-text-tertiary)]">
                  City, neighbourhood, or address
                </span>
              </button>
              <Button size="lg" onClick={openSearch} className="h-[56px] shrink-0 px-8 type-label sm:px-10">
                Search
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={goToMap}
                  className="rounded-full bg-white/12 px-5 py-2.5 text-left backdrop-blur-md transition-colors hover:bg-white/25"
                >
                  <span className="type-label text-white">{link.label}</span>
                  <span className="ml-2 type-caption text-white/70">{link.sublabel}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured listings ──────────────────────────────── */}
        <section className="mx-auto max-w-[1200px] px-5 py-14 lg:px-8 lg:py-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="type-title-lg text-[var(--color-text-primary)]">Newest listings</h2>
              <p className="mt-1.5 type-body text-[var(--color-text-secondary)]">Fresh on the market across the GTA.</p>
            </div>
            <Button variant="surface" size="md" onClick={goToMap} className="hidden shrink-0 gap-1.5 type-label sm:flex">
              View all
              <ArrowRight size={16} />
            </Button>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} variant="grid" />
            ))}
          </div>

          <Button variant="surface" size="md" onClick={goToMap} className="mt-8 w-full gap-1.5 type-label sm:hidden">
            View all on the map
            <ArrowRight size={16} />
          </Button>
        </section>

        {/* ── Browse by neighbourhood ────────────────────────── */}
        <section className="bg-[var(--color-surface)]">
          <div className="mx-auto max-w-[1200px] px-5 py-14 lg:px-8 lg:py-20">
            <h2 className="type-title-lg text-[var(--color-text-primary)]">Browse by neighbourhood</h2>
            <p className="mt-1.5 type-body text-[var(--color-text-secondary)]">Discover the areas Torontonians love.</p>

            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {neighborhoods.map((neighborhood) => (
                <button
                  key={neighborhood.id}
                  onClick={goToMap}
                  className="group flex flex-col overflow-hidden rounded-[24px] bg-white text-left shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={neighborhood.thumbnail}
                      alt={neighborhood.name}
                      fill
                      sizes="(min-width: 1024px) 280px, 45vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="px-4 py-3.5">
                    <p className="type-heading-sm text-[var(--color-text-primary)]">{neighborhood.name}</p>
                    <p className="mt-1 type-caption text-[var(--color-text-secondary)]">
                      {neighborhood.listingCount} listings · {formatAvgPrice(neighborhood.avgPrice)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Value props ────────────────────────────────────── */}
        <section className="mx-auto max-w-[1200px] px-5 py-14 lg:px-8 lg:py-20">
          <div className="grid gap-5 sm:grid-cols-3">
            {VALUE_PROPS.map((prop) => (
              <div key={prop.title} className="rounded-[24px] border border-[var(--color-border)] p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-surface)] text-[var(--color-brand-600)]">
                  <prop.icon size={22} />
                </span>
                <h3 className="mt-4 type-heading text-[var(--color-text-primary)]">{prop.title}</h3>
                <p className="mt-2 type-body text-[var(--color-text-secondary)]">{prop.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA band ───────────────────────────────────────── */}
        <section className="mx-auto max-w-[1200px] px-5 pb-16 lg:px-8 lg:pb-24">
          <div className="relative overflow-hidden rounded-[32px] bg-[var(--color-primary)] px-8 py-14 text-center lg:py-20">
            <h2 className="mx-auto max-w-2xl type-title-lg text-white lg:text-[2.25rem]">
              Ready to find your next home?
            </h2>
            <p className="mx-auto mt-3 max-w-lg type-body-lg text-white/75">
              Start exploring active listings on the map, then save the ones you love.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={goToMap} className="gap-2 px-8 type-label">
                <Building2 size={18} />
                Explore the map
              </Button>
              <Button variant="surface" size="lg" onClick={openSearch} className="gap-2 px-8 type-label">
                <Search size={18} />
                Search listings
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 type-caption text-white/65">
              <ShieldCheck size={15} />
              Trusted listings across the Greater Toronto Area
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer className="border-t border-[var(--color-border)] bg-white">
          <div className="mx-auto max-w-[1200px] px-5 pt-12 pb-28 lg:px-8 lg:pb-12">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.title}>
                  <p className="type-label text-[var(--color-text-primary)]">{column.title}</p>
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {column.links.map((link) => (
                      <li key={link}>
                        <button className="type-body text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                          {link}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6 sm:flex-row">
              <span className="relative h-5 w-28">
                <Image src="/icons/zoocasa-black.svg" alt="Zoocasa" fill sizes="112px" className="object-contain object-left" />
              </span>
              <p className="type-caption text-[var(--color-text-tertiary)]">© {2026} Homes. For demo purposes only.</p>
            </div>
          </div>
        </footer>
      </div>
    </PageShell>
  );
}
