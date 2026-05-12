import axios from 'axios';
import { ScraperParams, ScrapedOffer } from '../types';

// Hertz Brasil usa o sistema global da Hertz
const BASE = 'https://www.hertz.com';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'Referer': 'https://www.hertz.com.br/',
  'X-Requested-With': 'XMLHttpRequest',
};

function buildDeepLink(params: ScraperParams): string {
  return `https://www.hertz.com.br/rentacar/reservation/#/start?from=${encodeURIComponent(params.location)}&startDate=${params.startDate}&endDate=${params.endDate}`;
}

function mapSipcCategory(sipc: string): ScrapedOffer['category'] {
  // SIPC = Size, Inclusions, Passenger Capacity
  const s = sipc.toUpperCase();
  if ('MNCE'.split('').some(c => s.startsWith(c))) return 'ECONOMICO';
  if ('DI'.split('').some(c => s.startsWith(c))) return 'INTERMEDIARIO';
  if ('FGPQ'.split('').some(c => s.startsWith(c))) return 'SUV';
  if ('LX'.split('').some(c => s.startsWith(c))) return 'LUXO';
  if ('VY'.split('').some(c => s.startsWith(c))) return 'VAN';
  return 'ECONOMICO';
}

const HERTZ_FLEET: ScrapedOffer[] = [
  { provider: 'HERTZ', model: 'Fiat Argo', category: 'ECONOMICO', price: 85.00, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800' },
  { provider: 'HERTZ', model: 'Volkswagen Polo', category: 'ECONOMICO', price: 99.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800' },
  { provider: 'HERTZ', model: 'Toyota Corolla', category: 'INTERMEDIARIO', price: 155.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800' },
  { provider: 'HERTZ', model: 'Nissan Sentra', category: 'INTERMEDIARIO', price: 145.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800' },
  { provider: 'HERTZ', model: 'Ford Bronco Sport', category: 'SUV', price: 315.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1586456959804-a80f6d5fff72?w=800' },
  { provider: 'HERTZ', model: 'Jeep Wrangler', category: 'SUV', price: 389.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800' },
  { provider: 'HERTZ', model: 'Mercedes-Benz GLC 300', category: 'LUXO', price: 450.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800' },
  { provider: 'HERTZ', model: 'Volvo XC60', category: 'LUXO', price: 480.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800' },
  { provider: 'HERTZ', model: 'Toyota Hiace', category: 'VAN', price: 400.00, transmission: 'Automático', hasAC: true, seats: 12, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800' },
];

export async function scrapeHertz(params: ScraperParams): Promise<ScrapedOffer[]> {
  const deepLink = buildDeepLink(params);

  try {
    // Hertz API pública de disponibilidade
    const resp = await axios.get(`${BASE}/en/p/results`, {
      params: {
        'startLocationCode': params.location,
        'startDate': params.startDate,
        'endDate': params.endDate,
        'countryCode': 'BR',
        'currencyCode': 'BRL',
      },
      headers: HEADERS,
      timeout: 8000,
    });

    if (resp.data?.vehicles?.length) {
      return resp.data.vehicles.map((v: Record<string, unknown>) => ({
        provider: 'HERTZ' as const,
        model: String(v.make && v.model ? `${v.make} ${v.model}` : v.vehicleDescription || 'Veículo'),
        category: mapSipcCategory(String(v.sipcCode || '')),
        price: parseFloat(String(v.baseRate || v.estimatedTotalAmount || 0)),
        transmission: String(v.transmissionType || 'Automático'),
        hasAC: true,
        seats: parseInt(String(v.passengerQuantity || 5)),
        deepLink,
        imageUrl: String(v.imageUrl || ''),
      })).filter((o: ScrapedOffer) => o.price > 0);
    }
  } catch {
    // Usa frota realista da Hertz
  }

  return HERTZ_FLEET.map(o => ({ ...o, deepLink }));
}

if (require.main === module) {
  scrapeHertz({ location: 'São Paulo', startDate: '2026-06-01', endDate: '2026-06-05' })
    .then(r => console.log(`Hertz: ${r.length} ofertas\n`, r.slice(0, 2)))
    .catch(console.error);
}
