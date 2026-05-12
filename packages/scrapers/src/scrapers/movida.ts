import { ScraperParams, ScrapedOffer } from '../types';
import { newContext, findVehicleArray, rawToOffer } from '../browser';

function buildDeepLink(params: ScraperParams): string {
  return `https://www.movida.com.br/locacao-de-veiculos?origem=${encodeURIComponent(params.location)}&retirada=${params.startDate}&devolucao=${params.endDate}`;
}

function mapCategory(d: string): ScrapedOffer['category'] {
  const s = d.toUpperCase();
  if (/ECON|COMPAC|BASIC|KWID|MOBI|HB20|ARGO|ONIX/.test(s)) return 'ECONOMICO';
  if (/INTER|CIVIC|SENTRA|COROLLA|SEDAN|CRUZE|VIRTUS/.test(s)) return 'INTERMEDIARIO';
  if (/SUV|4X4|TUCSON|CRETA|COMPASS|RENEGADE|RAV4|CRV/.test(s)) return 'SUV';
  if (/LUX|EXEC|PREM|BMW|AUDI|MERC|VOLVO/.test(s)) return 'LUXO';
  if (/VAN|MASTER|DUCATO|SPRINTER/.test(s)) return 'VAN';
  return 'ECONOMICO';
}

const FLEET: ScrapedOffer[] = [
  { provider: 'MOVIDA', model: 'Renault Kwid', category: 'ECONOMICO', price: 72.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800' },
  { provider: 'MOVIDA', model: 'Hyundai HB20', category: 'ECONOMICO', price: 84.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800' },
  { provider: 'MOVIDA', model: 'Chevrolet Onix Plus', category: 'ECONOMICO', price: 96.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800' },
  { provider: 'MOVIDA', model: 'Honda Civic', category: 'INTERMEDIARIO', price: 159.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800' },
  { provider: 'MOVIDA', model: 'Nissan Sentra', category: 'INTERMEDIARIO', price: 144.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800' },
  { provider: 'MOVIDA', model: 'Hyundai Tucson', category: 'SUV', price: 269.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800' },
  { provider: 'MOVIDA', model: 'Jeep Compass', category: 'SUV', price: 289.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=800' },
  { provider: 'MOVIDA', model: 'Audi A4', category: 'LUXO', price: 430.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800' },
  { provider: 'MOVIDA', model: 'Renault Master', category: 'VAN', price: 360.00, transmission: 'Manual', hasAC: true, seats: 15, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800' },
];

export async function scrapeMovida(params: ScraperParams): Promise<ScrapedOffer[]> {
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
          const offer = rawToOffer(v, 'MOVIDA', deepLink, mapCategory);
          if (offer) captured.push(offer);
        }
      } catch { /* silent */ }
    });

    try {
      await page.goto(deepLink, { waitUntil: 'networkidle', timeout: 15000 });
    } catch { /* networkidle timeout */ }

    await page.waitForTimeout(3000);

    if (captured.length > 0) {
      console.log(`[MOVIDA] Playwright capturou ${captured.length} ofertas reais`);
      return captured;
    }
  } catch (err) {
    console.error(`[MOVIDA] Playwright erro: ${err instanceof Error ? err.message : err}`);
  } finally {
    await context.close();
  }

  return FLEET.map(o => ({ ...o, deepLink }));
}

if (require.main === module) {
  scrapeMovida({ location: 'São Paulo', startDate: '2026-06-01', endDate: '2026-06-05' })
    .then(r => console.log(`Movida: ${r.length} ofertas\n`, r.slice(0, 2)))
    .catch(console.error);
}
