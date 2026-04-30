import { notFound } from 'next/navigation';
import { MOCK_LISTINGS } from '@/lib/mock-data';
import ListingPageContent from '@/features/listings/ListingPageContent';

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

  return <ListingPageContent listing={listing} />;
}
