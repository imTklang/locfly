import https from 'https';
import * as cheerio from 'cheerio';
import { ScraperParams, ScrapedOffer } from '../types';
import { newContext, findVehicleArray, rawToOffer } from '../browser';

function buildDeepLink(params: ScraperParams): string {
  const q = new URLSearchParams({
    origem: params.location,
    retirada: params.startDate,
    devolucao: params.endDate,
  });
  return `https://reservas.aluguefoco.com.br/?${q}`;
}

function mapCategory(s: string): ScrapedOffer['category'] {
  const c = s.toUpperCase();
  if (/ECON|COMPAC|MINI|MOBI|HB20|SANDERO|KWID|ARGO/.test(c)) return 'ECONOMICO';
  if (/INTER|SEDAN|CRUZE|ETIOS|ONIX PLUS|VIRTUS/.test(c)) return 'INTERMEDIARIO';
  if (/SUV|CROSS|TRACKER|T-CROSS|CRETA|COMPASS|RENEGADE/.test(c)) return 'SUV';
  if (/LUX|EXEC|LEXUS|BMW|AUDI|MERCEDES/.test(c)) return 'LUXO';
  if (/VAN|HIACE|DUCATO|MASTER|SPRINTER/.test(c)) return 'VAN';
  return 'ECONOMICO';
}

// Fetches real fleet from Foco's /frota page via Cheerio HTML parsing
async function fetchFocaFrota(deepLink: string): Promise<ScrapedOffer[]> {
  return new Promise((resolve) => {
    const url = 'https://www.aluguefoco.com.br/frota';
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const $ = cheerio.load(body);
          const offers: ScrapedOffer[] = [];

          // Try multiple selector strategies for different page structures
          const selectors = [
            '.vehicle-card, .car-card, .frota-card, .veiculo-card',
            '[class*="vehicle"], [class*="carro"], [class*="veiculo"], [class*="frota"]',
            'article, .card, .item',
          ];

          for (const sel of selectors) {
            $(sel).each((_i, el) => {
              const model = $(el)
                .find('h2, h3, h4, .title, .nome, [class*="title"], [class*="nome"], [class*="model"]')
                .first().text().trim();
              const priceText = $(el)
                .find('.preco, .price, .valor, [class*="price"], [class*="preco"], [class*="valor"]')
                .first().text().trim();
              const price = parseFloat(priceText.replace(/[^0-9,.]/g, '').replace(',', '.'));
              const imgSrc = $(el).find('img').first().attr('src') ?? '';

              if (model && model.length > 3 && price > 0) {
                offers.push({
                  provider: 'FOCO',
                  model,
                  category: mapCategory(model),
                  price,
                  transmission: /auto|cvt/i.test($(el).text()) ? 'Automático' : 'Manual',
                  hasAC: true,
                  seats: /van|hiace|master/i.test(model) ? 12 : 5,
                  deepLink,
                  imageUrl: imgSrc.startsWith('http') ? imgSrc : undefined,
                });
              }
            });
            if (offers.length > 0) break;
          }

          // Also try JSON-LD structured data on the page
          if (offers.length === 0) {
            $('script[type="application/ld+json"]').each((_i, el) => {
              try {
                const data = JSON.parse($(el).html() ?? '');
                const items = Array.isArray(data) ? data : [data];
                for (const item of items) {
                  if (item?.name && item?.offers?.price) {
                    offers.push({
                      provider: 'FOCO',
                      model: item.name,
                      category: mapCategory(item.name),
                      price: parseFloat(item.offers.price),
                      transmission: 'Manual',
                      hasAC: true,
                      seats: 5,
                      deepLink,
                      imageUrl: item.image,
                    });
                  }
                }
              } catch { /* silent */ }
            });
          }

          resolve(offers);
        } catch {
          resolve([]);
        }
      });
      res.on('error', () => resolve([]));
    }).on('error', () => resolve([]));
  });
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
          if (/api|veicul|frota|carro/i.test(url)) {
            console.log(`[FOCO][json] ${url.slice(0, 90)}`);
          }
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
      await page.goto('https://www.aluguefoco.com.br/', { waitUntil: 'domcontentloaded', timeout: 12000 });
    } catch { /* timeout */ }

    await page.waitForTimeout(2000);

    // Try Cheerio on Playwright-loaded DOM
    if (captured.length === 0) {
      const html = await page.content();
      const $ = cheerio.load(html);
      $('.vehicle-card, .car-card, .veiculo-card, [class*="vehicle"], [class*="veiculo"]').each((_i, el) => {
        const model = $(el).find('h2, h3, h4, .title, .nome').first().text().trim();
        const priceText = $(el).find('.preco, .price, .valor, [class*="price"]').first().text().trim();
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
      console.log(`[FOCO] ✓ ${captured.length} ofertas capturadas via Playwright`);
      return captured;
    }

    console.log(`[FOCO] ✗ Playwright sem dados — tentando HTTP + Cheerio na /frota...`);
  } catch (err) {
    console.error(`[FOCO] erro: ${err instanceof Error ? err.message : err}`);
  } finally {
    await context.close();
  }

  // Fallback: direct HTTP fetch of /frota page
  const fromHttp = await fetchFocaFrota(deepLink);
  if (fromHttp.length > 0) {
    console.log(`[FOCO] ✓ ${fromHttp.length} ofertas via HTTP + Cheerio`);
    return fromHttp;
  }

  console.log(`[FOCO] ✗ sem dados reais — usando frota de referência`);
  return FLEET.map((o) => ({ ...o, deepLink }));
}

if (require.main === module) {
  scrapeFoco({ location: 'São Paulo', startDate: '2026-06-01', endDate: '2026-06-05' })
    .then((r) => console.log(`Foco: ${r.length} ofertas\n`, r.slice(0, 2)))
    .catch(console.error);
}
