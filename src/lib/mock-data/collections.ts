import { Collection, ForYouItem } from '@/lib/types';

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: 'col-001',
    name: 'Toronto 2 beds condo',
    listings: [
      { listingId: 'lst-001', addedAt: '2026-04-20', notes: 'Love the views!', tags: ['top-pick'], order: 0 },
      { listingId: 'lst-003', addedAt: '2026-04-19', notes: 'Great location', tags: [], order: 1 },
      { listingId: 'lst-006', addedAt: '2026-04-18', notes: '', tags: ['loft-vibe'], order: 2 },
      { listingId: 'lst-008', addedAt: '2026-04-17', notes: 'Good price point', tags: [], order: 3 },
    ],
    collaborators: [
      { id: 'user-1', name: 'You', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you' },
      { id: 'user-2', name: 'Partner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=partner' },
    ],
    tags: ['condos', 'downtown'],
    createdAt: '2026-04-15',
    updatedAt: '2026-04-20',
  },
  {
    id: 'col-002',
    name: 'Houses with yards',
    listings: [
      { listingId: 'lst-002', addedAt: '2026-04-18', notes: 'Great neighbourhood', tags: ['has-yard'], order: 0 },
      { listingId: 'lst-004', addedAt: '2026-04-17', notes: '', tags: [], order: 1 },
      { listingId: 'lst-005', addedAt: '2026-04-16', notes: 'Potential fixer upper', tags: ['needs-reno'], order: 2 },
      { listingId: 'lst-009', addedAt: '2026-04-15', notes: 'Love Cabbagetown', tags: ['top-pick'], order: 3 },
      { listingId: 'lst-010', addedAt: '2026-04-14', notes: '', tags: [], order: 4 },
      { listingId: 'lst-007', addedAt: '2026-04-13', notes: 'Dream home!', tags: ['dream'], order: 5 },
    ],
    collaborators: [
      { id: 'user-1', name: 'You', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you' },
    ],
    tags: ['houses', 'family'],
    createdAt: '2026-04-10',
    updatedAt: '2026-04-18',
  },
];

export const MOCK_SAVED_SEARCHES = [
  {
    id: 'ss-001',
    name: 'Toronto Downtown',
    locations: [
      { id: 'loc-downtown', name: 'Toronto Downtown', type: 'area' as const, coordinates: { lat: 43.6532, lng: -79.3832 }, city: 'Toronto', province: 'ON' },
    ],
    filters: { propertyTypes: ['condo' as const], minBeds: 2, maxPrice: 1000000 },
    createdAt: '2026-04-10',
    newListingsCount: 15,
    thumbnail: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80',
  },
  {
    id: 'ss-002',
    name: 'Annex Houses',
    locations: [
      { id: 'loc-annex', name: 'Annex', type: 'neighborhood' as const, coordinates: { lat: 43.6680, lng: -79.4050 }, city: 'Toronto', province: 'ON' },
    ],
    filters: { propertyTypes: ['house' as const, 'semi-detached' as const], minBeds: 3 },
    createdAt: '2026-04-05',
    newListingsCount: 4,
    thumbnail: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=80',
  },
];

export const MOCK_FOR_YOU: ForYouItem[] = [
  {
    id: 'fyu-001',
    type: 'listing',
    title: 'New match in Church St Corridor',
    description: 'Based on your saved search, this 3-bed condo just hit the market.',
    listingId: 'lst-001',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    createdAt: '2026-04-20',
  },
  {
    id: 'fyu-002',
    type: 'price-drop',
    title: 'Price drop alert',
    description: 'A saved listing dropped by $50K in Kensington Market.',
    listingId: 'lst-005',
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
    createdAt: '2026-04-19',
  },
  {
    id: 'fyu-003',
    type: 'neighborhood-insight',
    title: 'YorkVille Market Insight',
    description: 'Average prices up 3.2% this month. Inventory is tight with only 32 active listings.',
    imageUrl: 'https://images.unsplash.com/photo-1541336032412-2048a678540d?w=800&q=80',
    createdAt: '2026-04-18',
  },
  {
    id: 'fyu-004',
    type: 'market-update',
    title: 'Toronto Market Update — April 2026',
    description: 'Detached home sales up 12% YoY. Condo market cooling with increased inventory in downtown core.',
    imageUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
    createdAt: '2026-04-17',
  },
  {
    id: 'fyu-005',
    type: 'listing',
    title: 'You might love this in Annex',
    description: 'A semi-detached that matches your style preferences — large yard, original details.',
    listingId: 'lst-002',
    imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
    createdAt: '2026-04-16',
  },
];
