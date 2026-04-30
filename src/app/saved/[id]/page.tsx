import CollectionPageClient from '@/features/collections/CollectionPageClient';

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params;
  return <CollectionPageClient collectionId={id} />;
}
