import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Bath, BedDouble, Calendar, Car, DollarSign, Heart, Home, MapPin, Ruler } from 'lucide-react';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { formatDaysOnMarket, formatPriceFull, formatPropertyType, formatSqft } from '@/lib/utils/format';
import BackButton from '@/components/atoms/BackButton';

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return MOCK_LISTINGS.map((listing) => ({ id: listing.id }));
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const listing = MOCK_LISTINGS.find((item) => item.id === id);
  if (!listing) notFound();

  return (
    <main className="h-full overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-5 lg:px-8 lg:py-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <BackButton />
          <button className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0F1729] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1F2937]">
            <Heart size={15} />
            Save
          </button>
        </div>

        <section className="grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#F5F6F7] lg:aspect-[16/10]">
            <Image src={listing.images[0]} alt={listing.address} fill priority className="object-cover" sizes="(min-width: 1024px) 64vw, 100vw" />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {listing.images.slice(1, 3).map((image, index) => (
              <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#F5F6F7] lg:aspect-auto">
                <Image src={image} alt={`${listing.address} photo ${index + 2}`} fill className="object-cover" sizes="(min-width: 1024px) 28vw, 50vw" />
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 py-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="type-hero text-[#0F1729]">{formatPriceFull(listing.price)}</h1>
                <p className="mt-2 flex items-center gap-1.5 type-body text-[#6B7280]">
                  <MapPin size={15} className="text-[#9CA3AF]" />
                  {listing.address}, {listing.city}, {listing.province}
                </p>
              </div>
              <span className="rounded-full bg-[#F5F6F7] px-3 py-1.5 type-label text-[#6B7280]">
                {formatDaysOnMarket(listing.daysOnMarket)}
              </span>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Fact icon={<BedDouble size={17} />} label="Beds" value={`${listing.beds}`} />
              <Fact icon={<Bath size={17} />} label="Baths" value={`${listing.baths}`} />
              <Fact icon={<Ruler size={17} />} label="Area" value={formatSqft(listing.sqft)} />
              <Fact icon={<Home size={17} />} label="Type" value={formatPropertyType(listing.propertyType)} />
            </div>

            <div className="my-8 h-px bg-[#F5F6F7]" />

            <h2 className="type-title text-[#0F1729]">About This Home</h2>
            <p className="mt-3 max-w-3xl type-body leading-7 text-[#6B7280]">{listing.description}</p>

            <div className="my-8 h-px bg-[#F5F6F7]" />

            <h2 className="type-title text-[#0F1729]">Features & Amenities</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {listing.features.map((feature) => (
                <span key={feature} className="rounded-full bg-[#F5F6F7] px-3 py-1.5 type-body font-medium text-[#6B7280]">
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-[#F0F0F0] p-4">
            <div className="space-y-3">
              <SideFact icon={<Calendar size={16} />} label="Year Built" value={listing.yearBuilt.toString()} />
              <SideFact icon={<Car size={16} />} label="Parking" value={`${listing.parkingSpaces} space${listing.parkingSpaces === 1 ? '' : 's'}`} />
              <SideFact icon={<DollarSign size={16} />} label="Taxes/Yr" value={`$${listing.taxes.toLocaleString()}`} />
              {listing.maintenanceFee && (
                <SideFact icon={<DollarSign size={16} />} label="Maint./Mo" value={`$${listing.maintenanceFee.toLocaleString()}`} />
              )}
              <SideFact icon={<Home size={16} />} label="MLS" value={listing.mlsNumber} />
            </div>
            <button className="mt-5 h-12 w-full rounded-full bg-[#0F1729] type-label text-white transition-colors hover:bg-[#1F2937]">
              Contact Agent
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F5F6F7] p-4">
      <div className="mb-2 text-[#9CA3AF]">{icon}</div>
      <p className="type-caption text-[#9CA3AF]">{label}</p>
      <p className="mt-0.5 type-label text-[#0F1729]">{value}</p>
    </div>
  );
}

function SideFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#F5F6F7] p-3">
      <span className="text-[#9CA3AF]">{icon}</span>
      <div>
        <p className="type-caption text-[#9CA3AF]">{label}</p>
        <p className="type-label text-[#0F1729]">{value}</p>
      </div>
    </div>
  );
}
