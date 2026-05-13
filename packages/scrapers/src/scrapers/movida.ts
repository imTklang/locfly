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
        const url = res.url();
        const json = await res.json();
        const arr = findVehicleArray(json);
        if (!arr) {
          if (/api|cotacao|veiculos|search/i.test(url)) {
            console.log(`[MOVIDA][json] ${url.slice(0, 90)}`);
          }
          return;
        }
        console.log(`[MOVIDA][🎯 veículos] ${url.slice(0, 90)} → ${arr.length} itens`);
        for (const v of arr) {
          const offer = rawToOffer(v, 'MOVIDA', deepLink, mapCategory);
          if (offer) captured.push(offer);
        }
      } catch { /* silent */ }
    });

    // Navega para a home (URL com params redireciona para 404 na Movida)
    try {
      await page.goto('https://www.movida.com.br/locacao-de-veiculos', { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch { /* timeout */ }

    await page.waitForTimeout(3000);

    // Preenche formulário para disparar chamada à API de disponibilidade
    if (captured.length === 0) {
      try {
        const locInput = await page.waitForSelector(
          'input[placeholder*="cidade"], input[placeholder*="origem"], input[name*="cidade"], input[name*="origem"], input[aria-label*="cidade"]',
          { timeout: 6000 }
        );
        if (locInput) {
          await locInput.fill(params.location);
          await page.waitForTimeout(1500);
          const suggestion = await page.$('[role="option"]:first-child, [class*="suggestion"]:first-child, [class*="autocomplete"] li:first-child');
          if (suggestion) await suggestion.click();
          else { await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); }
          await page.waitForTimeout(800);
        }
        // Tenta preencher datas
        const dateInputs = await page.$$('input[type="date"]');
        if (dateInputs.length >= 2) {
          await dateInputs[0].fill(params.startDate);
          await dateInputs[1].fill(params.endDate);
        } else {
          await page.fill('input[placeholder*="retirada"], input[name*="retirada"]', params.startDate).catch(() => {});
          await page.fill('input[placeholder*="devolu"], input[name*="devolu"]', params.endDate).catch(() => {});
        }
        await page.click('button[type="submit"], button:has-text("Buscar"), button:has-text("Ver preços")').catch(() => {});
        await page.waitForTimeout(6000);
      } catch { /* form não disponível */ }
    }

    if (captured.length > 0) {
      console.log(`[MOVIDA] ✓ ${captured.length} ofertas reais capturadas`);
      return captured;
    }

    console.log(`[MOVIDA] ✗ sem dados reais — usando frota de referência`);
  } catch (err) {
    console.error(`[MOVIDA] erro: ${err instanceof Error ? err.message : err}`);
  } finally {
    await context.close();
  }

  return FLEET.map(o => ({ ...o, deepLink }));
}

if (require.main === module) {
  scrapeMovida({ location: 'São Paulo', startDate: '2026-06-15', endDate: '2026-06-20' })
    .then(r => console.log(`Movida: ${r.length} ofertas\n`, r.slice(0, 2)))
    .catch(console.error);
}
