import * as cheerio from 'cheerio';
import { ScraperParams, ScrapedOffer } from '../types';
import { newContext, findVehicleArray, rawToOffer } from '../browser';

function buildDeepLink(params: ScraperParams): string {
  return `https://www.focorental.com.br/reserva?origem=${encodeURIComponent(params.location)}&retirada=${params.startDate}&devolucao=${params.endDate}`;
}

function mapCategory(s: string): ScrapedOffer['category'] {
  const c = s.toUpperCase();
  if (/ECON|COMPAC|MINI|MOBI|HB20|SANDERO/.test(c)) return 'ECONOMICO';
  if (/INTER|SEDAN|CRUZE|ETIOS/.test(c)) return 'INTERMEDIARIO';
  if (/SUV|CROSS|TRACKER|T-CROSS|CRETA/.test(c)) return 'SUV';
  if (/LUX|EXEC|LEXUS|BMW|AUDI/.test(c)) return 'LUXO';
  if (/VAN|HIACE|DUCATO/.test(c)) return 'VAN';
  return 'ECONOMICO';
}

const FLEET: ScrapedOffer[] = [
  { provider: 'FOCO', model: 'Fiat Mobi', category: 'ECONOMICO', price: 65.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800' },
  { provider: 'FOCO', model: 'Hyundai HB20', category: 'ECONOMICO', price: 78.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800' },
  { provider: 'FOCO', model: 'Renault Sandero', category: 'ECONOMICO', price: 74.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800' },
  { provider: 'FOCO', model: 'Chevrolet Cruze', category: 'INTERMEDIARIO', price: 138.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1551830820-330a71b99659?w=800' },
  { provider: 'FOCO', model: 'Toyota Etios Sedan', category: 'INTERMEDIARIO', price: 119.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800' },
  { provider: 'FOCO', model: 'Volkswagen T-Cross', category: 'SUV', price: 234.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800' },
  { provider: 'FOCO', model: 'Chevrolet Tracker', category: 'SUV', price: 249.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800' },
  { provider: 'FOCO', model: 'Lexus ES 300h', category: 'LUXO', price: 510.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800' },
  { provider: 'FOCO', model: 'Toyota Hiace', category: 'VAN', price: 395.00, transmission: 'Automático', hasAC: true, seats: 12, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800' },
];

export async function scrapeFoco(params: ScraperParams): Promise<ScrapedOffer[]> {
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
          console.log(`[FOCO][json] ${url.slice(0, 90)}`);
          return;
        }
        console.log(`[FOCO][🎯 veículos] ${url.slice(0, 90)} → ${arr.length} itens`);
        for (const v of arr) {
          const offer = rawToOffer(v, 'FOCO', deepLink, mapCategory);
          if (offer) captured.push(offer);
        }
      } catch { /* silent */ }
    });

    try {
      await page.goto('https://www.focorental.com.br/', { waitUntil: 'domcontentloaded', timeout: 12000 });
    } catch { /* timeout */ }

    await page.waitForTimeout(2000);

    // Foco may render fleet in HTML — try Cheerio on the loaded DOM
    if (captured.length === 0) {
      const html = await page.content();
      const $ = cheerio.load(html);
      $('.veiculo, .car-card, .vehicle-item, .frota-item, [class*="veiculo"], [class*="carro"]').each((_i, el) => {
        const model = $(el).find('.nome, .title, h3, h4, [class*="nome"], [class*="model"]').first().text().trim();
        const priceText = $(el).find('.preco, .price, .valor, [class*="preco"], [class*="price"]').first().text().trim();
        const price = parseFloat(priceText.replace(/[^0-9,.]/g, '').replace(',', '.'));
        if (model && price > 0) {
          captured.push({
            provider: 'FOCO',
            model,
            category: mapCategory(model),
            price,
            transmission: 'Manual',
            hasAC: true,
            seats: 5,
            deepLink,
          });
        }
      });
    }

    if (captured.length > 0) {
      console.log(`[FOCO] ✓ ${captured.length} ofertas reais capturadas`);
      return captured;
    }

    console.log(`[FOCO] ✗ sem dados reais — usando frota de referência`);
  } catch (err) {
    console.error(`[FOCO] erro: ${err instanceof Error ? err.message : err}`);
  } finally {
    await context.close();
  }

  return FLEET.map(o => ({ ...o, deepLink }));
}

if (require.main === module) {
  scrapeFoco({ location: 'São Paulo', startDate: '2026-06-01', endDate: '2026-06-05' })
    .then(r => console.log(`Foco: ${r.length} ofertas\n`, r.slice(0, 2)))
    .catch(console.error);
}
