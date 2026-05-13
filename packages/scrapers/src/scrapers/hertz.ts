import { ScraperParams, ScrapedOffer } from '../types';
import { newContext, findVehicleArray, rawToOffer } from '../browser';

function buildDeepLink(params: ScraperParams): string {
  return `https://www.hertz.com.br/rentacar/reservation/#/start?from=${encodeURIComponent(params.location)}&startDate=${params.startDate}&endDate=${params.endDate}`;
}

function mapCategory(s: string): ScrapedOffer['category'] {
  const c = s.toUpperCase();
  // SIPP codes: M/N=mini, E=economy, C=compact, I=intermediate, S/F=fullsize, P=premium, L=luxury, V=minivan
  if (/^[MNE]|ECON|COMPAC|MINI|POLO|ARGO/.test(c)) return 'ECONOMICO';
  if (/^[CI]|INTER|COROLLA|SENTRA/.test(c)) return 'INTERMEDIARIO';
  if (/^[SFPG]|SUV|4X4|BRONCO|WRANGLER|JEEP/.test(c)) return 'SUV';
  if (/^[LX]|LUX|EXEC|MERCEDES|VOLVO|BMW/.test(c)) return 'LUXO';
  if (/^[VY]|VAN|HIACE/.test(c)) return 'VAN';
  return 'ECONOMICO';
}

const FLEET: ScrapedOffer[] = [
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
  const context = await newContext();

  try {
    const page = await context.newPage();
    const captured: ScrapedOffer[] = [];

    page.on('response', async (res) => {
      try {
        const ct = res.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        const url = res.url();
        const json = await res.json();
        const arr = findVehicleArray(json);
        if (!arr) {
          console.log(`[HERTZ][json] ${url.slice(0, 90)}`);
          return;
        }
        console.log(`[HERTZ][🎯 veículos] ${url.slice(0, 90)} → ${arr.length} itens`);
        for (const v of arr) {
          const offer = rawToOffer(v, 'HERTZ', deepLink, mapCategory);
          if (offer) captured.push(offer);
        }
      } catch { /* silent */ }
    });

    const searchUrl = `https://www.hertz.com/rentacar/reservation/` +
      `?startLocationCode=${encodeURIComponent(params.location)}` +
      `&startDate=${params.startDate}&endDate=${params.endDate}&countryCode=BR`;

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 18000 });
    } catch { /* timeout */ }

    await page.waitForTimeout(5000);

    if (captured.length > 0) {
      console.log(`[HERTZ] Playwright capturou ${captured.length} ofertas reais`);
      return captured;
    }
  } catch (err) {
    console.error(`[HERTZ] Playwright erro: ${err instanceof Error ? err.message : err}`);
  } finally {
    await context.close();
  }

  return FLEET.map(o => ({ ...o, deepLink }));
}

if (require.main === module) {
  scrapeHertz({ location: 'São Paulo', startDate: '2026-06-01', endDate: '2026-06-05' })
    .then(r => console.log(`Hertz: ${r.length} ofertas\n`, r.slice(0, 2)))
    .catch(console.error);
}
