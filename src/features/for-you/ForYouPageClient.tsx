'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import BackButton from '@/components/navigation/BackButton';
import { CitySelector } from '@/features/home/CitySelector';
import {
  MarketStatsStrip,
  MarketBoard,
  DeepDive,
  AreaFinder,
  CITY,
  CITY_OPTIONS,
  cityThumb,
} from '@/features/home/MarketSections';

// Insights page — mirrors the homepage market content for a selectable city.
export default function InsightsPage() {
  const router = useRouter();
  const [city, setCity] = useState(CITY);

  return (
    <PageShell showDesktopHeader={false} desktopWide>
      <div className="h-full overflow-y-auto bg-white">
        {/* Header — title + city selector */}
        <div className="flex items-center gap-3 px-5 pt-5 lg:px-12 lg:pt-7">
          <BackButton iconOnly className="shrink-0" />
          <h1 className="type-title-lg !text-[1.4rem] text-[var(--color-text-primary)] sm:!text-[1.7rem]">Market Insights</h1>
          <div className="ml-auto">
            <CitySelector city={city} options={CITY_OPTIONS} thumb={cityThumb} onChange={setCity} />
          </div>
        </div>

        {/* At a glance + stats */}
        <section className="w-full px-5 pt-7 lg:px-12">
          <h2 className="type-title-lg !text-[1.3rem] text-[var(--color-text-primary)] sm:!text-[1.55rem] lg:!text-[1.8rem]">
            {city} At A Glance
          </h2>
        </section>
        <MarketStatsStrip city={city} />

        <MarketBoard city={city} />
        <DeepDive city={city} />
        <AreaFinder city={city} onSelect={() => router.push('/')} />

        <div className="h-16 lg:h-10" />
      </div>
    </PageShell>
  );
}
