export type Provider = 'LOCALIZA' | 'MOVIDA' | 'UNIDAS' | 'HERTZ' | 'FOCO' | 'OTHER';
export type Category = 'ECONOMICO' | 'INTERMEDIARIO' | 'SUV' | 'LUXO' | 'VAN';

export interface ScraperParams {
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface ScrapedOffer {
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

export interface ScraperResult {
  provider: Provider;
  offers: ScrapedOffer[];
  error?: string;
  durationMs: number;
}
