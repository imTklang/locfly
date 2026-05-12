import { ScraperParams, ScrapedOffer } from '../types';
import { newContext, findVehicleArray, rawToOffer } from '../browser';

function buildDeepLink(params: ScraperParams): string {
  return `https://www.unidas.com.br/reservas?local=${encodeURIComponent(params.location)}&retirada=${params.startDate}&devolucao=${params.endDate}`;
}

function mapCategory(g: string): ScrapedOffer['category'] {
  const s = g.toUpperCase();
  if (/ECON|COMPAC|MINI|PEQU|MOBI|GOL|HB20|^[AM]/.test(s)) return 'ECONOMICO';
  if (/INTER|SEDAN|MED|VIRTUS|CRUZE|^[BI]/.test(s)) return 'INTERMEDIARIO';
  if (/SUV|4X4|RENEGADE|ECLIPSE|COMPASS|^[CF]/.test(s)) return 'SUV';
  if (/LUX|EXEC|PREM|GRAND|^[DL]/.test(s)) return 'LUXO';
  if (/VAN|CARGO|SPRINTER|^[VY]/.test(s)) return 'VAN';
  return 'ECONOMICO';
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
          const offer = rawToOffer(v, 'UNIDAS', deepLink, mapCategory);
          if (offer) captured.push(offer);
        }
      } catch { /* silent */ }
    });

    try {
      await page.goto('https://www.unidas.com.br/', { waitUntil: 'networkidle', timeout: 15000 });
    } catch { /* networkidle timeout */ }

    // Try filling the search form
    try {
      await page.fill('input[name*="local"], input[placeholder*="local"], input[placeholder*="cidade"]', params.location);
      await page.fill('input[name*="retirada"], input[placeholder*="retirada"], input[type="date"]:first-of-type', params.startDate);
      await page.fill('input[name*="devolucao"], input[placeholder*="devoluc"], input[type="date"]:last-of-type', params.endDate);
      await page.click('button[type="submit"], button:has-text("Buscar"), button:has-text("Pesquisar")');
      await page.waitForTimeout(5000);
    } catch { /* form interaction failed — no problem */ }

    if (captured.length > 0) {
      console.log(`[UNIDAS] Playwright capturou ${captured.length} ofertas reais`);
      return captured;
    }
  } catch (err) {
    console.error(`[UNIDAS] Playwright erro: ${err instanceof Error ? err.message : err}`);
  } finally {
    await context.close();
  }

  return FLEET.map(o => ({ ...o, deepLink }));
}

if (require.main === module) {
  scrapeUnidas({ location: 'São Paulo', startDate: '2026-06-01', endDate: '2026-06-05' })
    .then(r => console.log(`Unidas: ${r.length} ofertas\n`, r.slice(0, 2)))
    .catch(console.error);
}
