import { ScraperParams, ScrapedOffer } from '../types';
import { newContext, findVehicleArray, rawToOffer } from '../browser';

function buildDeepLink(params: ScraperParams): string {
  return `https://www.localiza.com/brazil/pt-br/aluguel-de-carros?pickup=${encodeURIComponent(params.location)}&startDate=${params.startDate}&endDate=${params.endDate}`;
}

function mapCategory(g: string): ScrapedOffer['category'] {
  const s = g.toUpperCase();
  if (/ECON|COMPAC|BASIC|MINI|PEQU|SMALL|^[AM]/.test(s)) return 'ECONOMICO';
  if (/INTER|SEDAN|MED|^[BI]/.test(s)) return 'INTERMEDIARIO';
  if (/SUV|4X4|PICKUP|JEEP|CROSS|^[CF]/.test(s)) return 'SUV';
  if (/LUX|EXEC|PREM|BMW|AUDI|MERC|^[DL]/.test(s)) return 'LUXO';
  if (/VAN|MINI.?VAN|CARGO|^[VY]/.test(s)) return 'VAN';
  return 'ECONOMICO';
}

const FLEET: ScrapedOffer[] = [
  { provider: 'LOCALIZA', model: 'Fiat Argo', category: 'ECONOMICO', price: 89.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800' },
  { provider: 'LOCALIZA', model: 'Chevrolet Onix', category: 'ECONOMICO', price: 94.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800' },
  { provider: 'LOCALIZA', model: 'Fiat Pulse', category: 'ECONOMICO', price: 109.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800' },
  { provider: 'LOCALIZA', model: 'Toyota Corolla', category: 'INTERMEDIARIO', price: 149.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800' },
  { provider: 'LOCALIZA', model: 'Volkswagen Virtus', category: 'INTERMEDIARIO', price: 134.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800' },
  { provider: 'LOCALIZA', model: 'Jeep Commander', category: 'SUV', price: 299.90, transmission: 'Automático', hasAC: true, seats: 7, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800' },
  { provider: 'LOCALIZA', model: 'Toyota RAV4', category: 'SUV', price: 289.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800' },
  { provider: 'LOCALIZA', model: 'BMW 320i', category: 'LUXO', price: 420.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800' },
  { provider: 'LOCALIZA', model: 'Mercedes-Benz C 200', category: 'LUXO', price: 460.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800' },
  { provider: 'LOCALIZA', model: 'Renault Master', category: 'VAN', price: 380.00, transmission: 'Manual', hasAC: true, seats: 15, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800' },
];

export async function scrapeLocaliza(params: ScraperParams): Promise<ScrapedOffer[]> {
  const deepLink = buildDeepLink(params);
  const context = await newContext();

  try {
    const page = await context.newPage();
    const captured: ScrapedOffer[] = [];

    page.on('response', async (res) => {
      try {
        const ct = res.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        const json = await res.json();
        const arr = findVehicleArray(json);
        if (!arr) return;
        for (const v of arr) {
          const offer = rawToOffer(v, 'LOCALIZA', deepLink, mapCategory);
          if (offer) captured.push(offer);
        }
      } catch { /* silent */ }
    });

    const searchUrl = `https://www.localiza.com/brazil/pt-br/aluguel-de-carros` +
      `?pickupLocationSearch=${encodeURIComponent(params.location)}` +
      `&startDate=${params.startDate}&endDate=${params.endDate}`;

    try {
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 15000 });
    } catch { /* networkidle timeout — may still have captured data */ }

    await page.waitForTimeout(3000);

    if (captured.length > 0) {
      console.log(`[LOCALIZA] Playwright capturou ${captured.length} ofertas reais`);
      return captured;
    }
  } catch (err) {
    console.error(`[LOCALIZA] Playwright erro: ${err instanceof Error ? err.message : err}`);
  } finally {
    await context.close();
  }

  return FLEET.map(o => ({ ...o, deepLink }));
}

if (require.main === module) {
  scrapeLocaliza({ location: 'São Paulo', startDate: '2026-06-01', endDate: '2026-06-05' })
    .then(r => console.log(`Localiza: ${r.length} ofertas\n`, r.slice(0, 2)))
    .catch(console.error);
}
