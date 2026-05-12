export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Listing {
  id: string;
  price: number;
  address: string;
  city: string;
  neighborhood: string;
  province: string;
  postalCode: string;
  beds: number;
  baths: number;
  sqft: number;
  propertyType: PropertyType;
  listingDate: string;
  daysOnMarket: number;
  images: string[];
  coordinates: Coordinates;
  description: string;
  features: string[];
  mlsNumber: string;
  brokerage: string;
  parkingSpaces: number;
  yearBuilt: number;
  taxes: number;
  maintenanceFee?: number;
  listingMode?: ListingMode;
  listingStatus?: ListingStatus;
  amenities?: AmenityFilter[];
  hasLocker?: boolean;
}

export type ListingMode = 'buy' | 'rent';
export type SearchType = 'buy' | 'rent' | 'sold';
export type ListingStatus = 'active' | 'sold' | 'expired' | 'pending';
export type AmenityFilter = 'garage' | 'pool' | 'waterfront' | 'fireplace' | 'open-house';
export type LockerFilter = 'has' | 'none';
export type PropertyType = 'condo' | 'house' | 'townhouse' | 'land' | 'commercial' | 'farm' | 'semi-detached' | 'detached';

export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  coordinates: Coordinates;
  thumbnail: string;
  listingCount: number;
  avgPrice: number;
  boundary?: Coordinates[];
  description: string;
  walkScore: number;
  transitScore: number;
}

export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  minParking?: number;
  minSqft?: number;
  maxSqft?: number;
  propertyTypes: PropertyType[];
  maxDaysOnMarket?: number;
  searchType?: SearchType;
  listingMode?: ListingMode;
  listingStatus?: ListingStatus;
  amenities?: AmenityFilter[];
  locker?: LockerFilter;
  maxMaintenanceFee?: number;
  hideNoImages?: boolean;
  hasParking?: boolean;
  hasMaintenance?: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  locations: Location[];
  filters: SearchFilters;
  areaBoundary?: Coordinates[];
  areaBoundaries?: Coordinates[][];
  neighborhoodIds?: string[];
  createdAt: string;
  newListingsCount?: number;
  thumbnail?: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'city' | 'neighborhood' | 'area';
  coordinates: Coordinates;
  city?: string;
  province?: string;
  bbox?: [number, number, number, number];
  boundary?: Coordinates[];
}

export interface Collection {
  id: string;
  name: string;
  listings: CollectionListing[];
  collaborators?: CollaboratorAvatar[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionListing {
  listingId: string;
  addedAt: string;
  notes?: string;
  tags: string[];
  order: number;
}

export interface CollaboratorAvatar {
  id: string;
  name: string;
  avatar: string;
}

export type MapMode = 'explore' | 'area-select' | 'satellite';
export type BottomTab = 'explore' | 'map' | 'saved' | 'notifications' | 'menu' | 'for-you';
export type ActivePanel =
  | 'none'
  | 'search'
  | 'filter'
  | 'cards'
  | 'area-select'
  | 'listing-detail'
  | 'saved-searches';

export interface SwipeAction {
  listingId: string;
  action: 'like' | 'dislike' | 'skip';
}

export interface ForYouItem {
  id: string;
  type: 'listing' | 'neighborhood-insight' | 'market-update' | 'price-drop';
  title: string;
  description: string;
  listingId?: string;
  listing?: Listing;
  neighborhood?: Neighborhood;
  imageUrl?: string;
  createdAt: string;
}
