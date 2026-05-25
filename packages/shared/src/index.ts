// Providers and categories — sync with packages/scrapers/src/types.ts
export type Provider = 'LOCALIZA' | 'MOVIDA' | 'UNIDAS' | 'FOCO' | 'OTHER';
export type Category = 'ECONOMICO' | 'INTERMEDIARIO' | 'SUV' | 'LUXO' | 'VAN';

export interface SearchParams {
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface CarOfferDTO {
  id?: string;
  provider: Provider;
  model: string;
  category: Category;
  price: number;
  transmission: string;
  hasAC: boolean;
  seats: number;
  deepLink: string;
  imageUrl?: string;
}

export interface UserDTO {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
}

export interface PriceAlertDTO {
  id: string;
  userId: string;
  location: string;
  targetPrice: number;
  carCategory?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface BookmarkDTO {
  id: string;
  userId: string;
  carOfferId: string;
  carOffer?: CarOfferDTO;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface SearchResponse {
  offers: CarOfferDTO[];
  providers: Provider[];
  cachedAt?: string;
}
