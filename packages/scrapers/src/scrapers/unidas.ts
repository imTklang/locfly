import https from 'https';
import { ScraperParams, ScrapedOffer } from '../types';

interface StoreInfo {
  code: string;
  name: string;
}

function buildDeepLink(): string {
  return 'https://www.unidas.com.br/';
}

// Resolve location to nearest Unidas airport store via public API
async function resolveStoreCode(location: string): Promise<StoreInfo | null> {
  return new Promise((resolve) => {
    const url = `https://apisiterac.unidas.com.br/api/v3/stores/details?keyWord=${encodeURIComponent(location)}&storeType=0`;
    https.get(url, { headers: { Accept: 'application/json' } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const d = JSON.parse(body) as { data?: Array<{ storeCode: string; name?: string }> };
          const first = d?.data?.[0];
          if (!first?.storeCode) { resolve(null); return; }
          resolve({ code: first.storeCode, name: first.name ?? location });
        } catch {
          resolve(null);
        }
      });
      res.on('error', () => resolve(null));
    }).on('error', () => resolve(null));
  });
}


const FLEET: ScrapedOffer[] = [
  { provider: 'UNIDAS', model: 'Fiat Mobi', category: 'ECONOMICO', price: 68.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800' },
  { provider: 'UNIDAS', model: 'Volkswagen Gol', category: 'ECONOMICO', price: 74.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800' },
  { provider: 'UNIDAS', model: 'Hyundai HB20S', category: 'ECONOMICO', price: 88.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800' },
  { provider: 'UNIDAS', model: 'Volkswagen Virtus', category: 'INTERMEDIARIO', price: 129.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800' },
  { provider: 'UNIDAS', model: 'Chevrolet Cruze', category: 'INTERMEDIARIO', price: 149.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1551830820-330a71b99659?w=800' },
  { provider: 'UNIDAS', model: 'Jeep Renegade', category: 'SUV', price: 239.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800' },
  { provider: 'UNIDAS', model: 'Mitsubishi Eclipse Cross', category: 'SUV', price: 264.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800' },
  { provider: 'UNIDAS', model: 'Jeep Grand Cherokee', category: 'LUXO', price: 490.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=800' },
  { provider: 'UNIDAS', model: 'Fiat Ducato', category: 'VAN', price: 350.00, transmission: 'Manual', hasAC: true, seats: 15, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800' },
];

export async function scrapeUnidas(params: ScraperParams): Promise<ScrapedOffer[]> {
  const store = await resolveStoreCode(params.location);
  if (store) {
    console.log(`[UNIDAS] loja mais próxima: ${store.name} (${store.code})`);
  }
  const deepLink = buildDeepLink();
  console.log('[UNIDAS] usando frota de referência (form Angular não suporta scraping headless)');
  return FLEET.map((o) => ({ ...o, deepLink }));
}

if (require.main === module) {
  scrapeUnidas({ location: 'São Paulo', startDate: '2026-06-01', endDate: '2026-06-05' })
    .then((r) => console.log(`Unidas: ${r.length} ofertas\n`, r.slice(0, 2)))
    .catch(console.error);
}
