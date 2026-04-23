import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Bath, BedDouble, Calendar, Car, DollarSign, Home, MapPin, Ruler, Share2, ShieldCheck, Snowflake, Sun, TrainFront } from 'lucide-react';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import { formatDaysOnMarket, formatPriceFull, formatPropertyType, formatSqft } from '@/lib/utils/format';
import BackButton from '@/components/atoms/BackButton';
import PageShell from '@/components/templates/PageShell';
import ListingSaveButton from '@/components/molecules/ListingSaveButton';
import ListingImageGallery from '@/components/organisms/ListingImageGallery';

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
  const extendedDescription = `${listing.description} The home is arranged for everyday comfort with a practical floor plan, generous natural light, and flexible rooms that work for entertaining, focused work, or quiet evenings in. Recent updates emphasize durable finishes, efficient storage, and easy transitions between the kitchen, living area, and private spaces. The location keeps daily errands close while still feeling connected to transit, parks, restaurants, and neighborhood services.`;
  const monthlyCost = listing.maintenanceFee ? `$${listing.maintenanceFee.toLocaleString()}` : 'None';
  const agentImage = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&q=80';

  return (
    <PageShell showBottomNav={false} desktopWide desktopHeaderVariant="listing" desktopHeaderListingId={listing.id}>
      <main className="h-full overflow-y-auto bg-white pb-24 lg:pb-0">
        <div className="mx-auto w-full max-w-[1600px] px-5 py-5 lg:px-8 lg:pb-7 lg:pt-3">
          <ListingImageGallery images={listing.images} address={listing.address} />

          <section className="grid gap-8 py-8 lg:grid-cols-[1fr_360px]">
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
              <p className="mt-3 max-w-4xl type-body leading-7 text-[#6B7280]">{extendedDescription}</p>

              <div className="my-8 h-px bg-[#F5F6F7]" />

              <h2 className="type-title text-[#0F1729]">Home Facts</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <SideFact icon={<Calendar size={16} />} label="Year Built" value={listing.yearBuilt.toString()} />
                <SideFact icon={<Car size={16} />} label="Parking" value={`${listing.parkingSpaces} space${listing.parkingSpaces === 1 ? '' : 's'}`} />
                <SideFact icon={<DollarSign size={16} />} label="Taxes/Yr" value={`$${listing.taxes.toLocaleString()}`} />
                <SideFact icon={<DollarSign size={16} />} label="Maint./Mo" value={monthlyCost} />
                <SideFact icon={<Home size={16} />} label="MLS" value={listing.mlsNumber} />
                <SideFact icon={<TrainFront size={16} />} label="Transit" value="5 min walk" />
                <SideFact icon={<Sun size={16} />} label="Exposure" value={listing.propertyType === 'condo' ? 'South West' : 'Tree-lined lot'} />
                <SideFact icon={<Snowflake size={16} />} label="Cooling" value="Central Air" />
                <SideFact icon={<ShieldCheck size={16} />} label="Status" value="For Sale" />
              </div>

              <div className="my-8 h-px bg-[#F5F6F7]" />

              <h2 className="type-title text-[#0F1729]">Features & Amenities</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {listing.features.map((feature) => (
                  <span key={feature} className="rounded-full bg-[#F5F6F7] px-3 py-1.5 type-body font-medium text-[#6B7280]">
                    {feature}
                  </span>
                ))}
              </div>

              <div className="my-8 h-px bg-[#F5F6F7]" />

              <h2 className="type-title text-[#0F1729]">Neighborhood Notes</h2>
              <p className="mt-3 max-w-4xl type-body leading-7 text-[#6B7280]">
                Set in {listing.neighborhood}, this address is close to local cafes, grocery options, parks, and frequent transit. The surrounding blocks offer a balanced mix of residential calm and city access, making it practical for commuting, hosting, and daily routines.
              </p>
            </div>

            <aside className="hidden h-fit rounded-3xl border border-[#F0F0F0] p-6 lg:sticky lg:top-6 lg:block">
              <h2 className="type-title text-[#0F1729]">Contact Agent</h2>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#F5F6F7] p-3">
                <Image src={agentImage} alt="Maya Chen" width={56} height={56} className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="type-label text-[#0F1729]">Maya Chen</p>
                  <p className="mt-0.5 type-caption text-[#9CA3AF]">Homes Realty Advisor</p>
                  <p className="mt-1 type-caption text-[#6B7280]">Response in 10 minutes</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                <button className="h-12 rounded-full bg-[#0F1729] type-label text-white transition-colors hover:bg-[#1F2937]">
                  Book A Tour
                </button>
                <button className="h-12 rounded-full bg-[#F5F6F7] type-label text-[#0F1729] transition-colors hover:bg-[#EBEBEB]">
                  Contact Agent
                </button>
              </div>
            </aside>
          </section>
        </div>

        <div className="fixed inset-x-4 bottom-4 z-40 flex items-center gap-2 lg:hidden">
          <BackButton
            iconOnly
            className="h-11 w-11 shrink-0 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.05)] hover:bg-[#F5F6F7]"
          />
          <div className="flex flex-1 items-center gap-2 rounded-[28px] bg-white/95 p-2 shadow-[0_12px_34px_rgba(15,23,41,0.18)] backdrop-blur">
            <button
              type="button"
              aria-label="Share listing"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F5F6F7] text-[#0F1729] transition-colors hover:bg-[#EBEBEB]"
            >
              <Share2 size={16} />
            </button>
            <ListingSaveButton listingId={listing.id} variant="icon" />
            <button className="h-12 flex-1 rounded-full bg-[#0F1729] type-btn text-white">
              Contact Agent
            </button>
          </div>
        </div>
      </main>
    </PageShell>
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
