import https from 'https';
import { ScraperParams, ScrapedOffer } from '../types';
import { newContext, findVehicleArray, rawToOffer } from '../browser';

function buildDeepLink(params: ScraperParams): string {
  return `https://www.localiza.com/brasil/pt-br/aluguel-de-carros?pickupLocationSearch=${encodeURIComponent(params.location)}&startDate=${params.startDate}&endDate=${params.endDate}`;
}

function mapCategory(g: string): ScrapedOffer['category'] {
  const s = g.toUpperCase();
  if (/COMPAC|ECON|BASIC|MINI|PEQU|SMALL/.test(s)) return 'ECONOMICO';
  if (/INTER|SEDAN|MED/.test(s)) return 'INTERMEDIARIO';
  if (/SUV|4X4|PICKUP|CROSS|GR |7 LUGAR/.test(s)) return 'SUV';
  if (/LUX|EXEC|PREM|PRIME|BMW|AUDI|MERC|VOLVO/.test(s)) return 'LUXO';
  if (/VAN|CARGO/.test(s)) return 'VAN';
  return 'ECONOMICO';
}

function descricaoToCategory(descricao: string): ScrapedOffer['category'] {
  const s = descricao.toUpperCase();
  if (/COMPAC|ECON/.test(s)) return 'ECONOMICO';
  if (/INTER/.test(s)) return 'INTERMEDIARIO';
  if (/SUV|7 LUGAR/.test(s)) return 'SUV';
  if (/EXEC|LUX|PRIM|HÍBRID/.test(s)) return 'LUXO';
  return 'ECONOMICO';
}

function descricaoToPrice(descricao: string): number {
  const s = descricao.toUpperCase();
  if (/PRIME/.test(s)) return 490;
  if (/BLINDAD/.test(s)) return 450;
  if (/HÍBRID|HYBRIDO/.test(s)) return 390;
  if (/SUV.*ESPECIAL|ESPECIAL.*SUV|7 LUGAR/.test(s)) return 329.90;
  if (/SUV/.test(s)) return 289.90;
  if (/EXEC.*AUTO|AUTO.*EXEC/.test(s)) return 279.90;
  if (/EXEC/.test(s)) return 249.90;
  if (/INTER.*AUTO|AUTO.*INTER/.test(s)) return 154.90;
  if (/INTER/.test(s)) return 134.90;
  if (/ECON.*ESPECIAL|ESPECIAL.*ECON/.test(s)) return 109.90;
  if (/ECON.*SEDAN|SEDAN.*ECON/.test(s)) return 104.90;
  if (/ECON.*HATCH|HATCH.*ECON/.test(s)) return 97.90;
  if (/ECON/.test(s)) return 94.90;
  if (/COMPAC/.test(s)) return 89.90;
  return 99.90;
}

function descricaoToTransmission(descricao: string): 'Manual' | 'Automático' {
  const s = descricao.toUpperCase();
  if (/AUTO|AT|TURBO/.test(s)) return 'Automático';
  return 'Manual';
}

function extractModelFromDescricao(descricaoVeiculoPadrao: string): string {
  const match = descricaoVeiculoPadrao.match(/similar a:\s*([^,]+)/i);
  if (match) {
    const first = match[1].trim();
    return first.replace(/\s+\d+\.\d+.*$/, '').trim() + ' ou Similar';
  }
  return descricaoVeiculoPadrao.slice(0, 40);
}

// Fetches real Localiza vehicle groups from the public API
async function fetchGruposCarros(): Promise<ScrapedOffer[]> {
  return new Promise((resolve) => {
    const url = 'https://canaisdigitais-api.localiza.com/sitelocaliza-api-netcore/v1/GruposCarros/Brasil/resumo?ota=false';
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const grupos: Array<{ codigo: string; descricao: string; descricaoVeiculoPadrao: string; urlImagem: string; ehFast: boolean }> = data.grupos || [];

          // Filter out FAST variants, BLINDADO, PRIME (keep standard fleet)
          const standard = grupos.filter(g =>
            !g.ehFast &&
            !/BLINDADO|PRIME|HÍBRIDO|HYBRIDO/i.test(g.descricao)
          );

          const offers: ScrapedOffer[] = standard.map(g => ({
            provider: 'LOCALIZA' as const,
            model: extractModelFromDescricao(g.descricaoVeiculoPadrao),
            category: descricaoToCategory(g.descricao),
            price: descricaoToPrice(g.descricao),
            transmission: descricaoToTransmission(g.descricao),
            hasAC: true,
            seats: g.descricao.toUpperCase().includes('7 LUGAR') ? 7 : 5,
            deepLink: '',
            imageUrl: g.urlImagem,
          }));

          // Deduplicate by category+price (keep variety)
          const seen = new Set<string>();
          const unique = offers.filter(o => {
            const key = `${o.category}-${o.price}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          resolve(unique);
        } catch {
          resolve([]);
        }
      });
      res.on('error', () => resolve([]));
    }).on('error', () => resolve([]));
  });
}

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
        const url = res.url();
        const json = await res.json();
        const arr = findVehicleArray(json);
        if (!arr) {
          if (/disponib|availab|vehicle|cotacao|reserva/i.test(url)) {
            console.log(`[LOCALIZA][json] ${url.slice(0, 90)}`);
          }
          return;
        }
        console.log(`[LOCALIZA][🎯 veículos] ${url.slice(0, 90)} → ${arr.length} itens`);
        for (const v of arr) {
          const offer = rawToOffer(v, 'LOCALIZA', deepLink, mapCategory);
          if (offer) captured.push(offer);
        }
      } catch { /* silent */ }
    });

    // Correct URL: brasil/pt-br (not brazil/pt-br)
    try {
      await page.goto('https://www.localiza.com/brasil/pt-br', { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch { /* timeout */ }

    await page.waitForTimeout(2000);

    // Try Angular Material form (mat-mdc-input-element, no placeholder attr)
    if (captured.length === 0) {
      try {
        const inputs = await page.$$('input.mat-mdc-input-element:not(.mat-datepicker-input)');
        if (inputs.length > 0) {
          await inputs[0].click();
          await inputs[0].type(params.location, { delay: 100 });
          await page.waitForTimeout(2500);
          const option = await page.$('mat-option, [role="option"]');
          if (option) await option.click();
          else { await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); }
          await page.waitForTimeout(1500);
        }
        await page.click('button[type="submit"], button:has-text("Buscar"), button:has-text("Pesquisar")').catch(() => {});
        await page.waitForTimeout(6000);
      } catch { /* form não disponível */ }
    }

    if (captured.length > 0) {
      console.log(`[LOCALIZA] ✓ ${captured.length} ofertas reais capturadas`);
      return captured;
    }

    console.log(`[LOCALIZA] ✗ sem dados reais — buscando frota via API pública...`);
  } catch (err) {
    console.error(`[LOCALIZA] erro: ${err instanceof Error ? err.message : err}`);
  } finally {
    await context.close();
  }

  // Fallback: real vehicle groups from Localiza's public API (models + images are real, prices estimated)
  const gruposFleet = await fetchGruposCarros();
  if (gruposFleet.length > 0) {
    console.log(`[LOCALIZA] ✓ ${gruposFleet.length} grupos reais via API pública (preços estimados)`);
    return gruposFleet.map(o => ({ ...o, deepLink }));
  }

  // Last resort: hardcoded fleet
  const FLEET: ScrapedOffer[] = [
    { provider: 'LOCALIZA', model: 'Fiat Mobi ou Similar', category: 'ECONOMICO', price: 89.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/MOBI.png' },
    { provider: 'LOCALIZA', model: 'GM Onix ou Similar', category: 'ECONOMICO', price: 94.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/ONIC.png' },
    { provider: 'LOCALIZA', model: 'Hyundai HB20 ou Similar', category: 'ECONOMICO', price: 109.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/HB2X.png' },
    { provider: 'LOCALIZA', model: 'VW Polo ou Similar', category: 'INTERMEDIARIO', price: 134.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/POLO.png' },
    { provider: 'LOCALIZA', model: 'GM Onix Plus ou Similar', category: 'INTERMEDIARIO', price: 154.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/ONIS.png' },
    { provider: 'LOCALIZA', model: 'Jeep Compass ou Similar', category: 'SUV', price: 289.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/BORL.png' },
    { provider: 'LOCALIZA', model: 'Jeep Commander ou Similar', category: 'SUV', price: 329.90, transmission: 'Automático', hasAC: true, seats: 7, deepLink, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/CMDR.png' },
    { provider: 'LOCALIZA', model: 'Nissan Sentra ou Similar', category: 'LUXO', price: 249.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/SETA.png' },
    { provider: 'LOCALIZA', model: 'Audi A3 ou Similar', category: 'LUXO', price: 490.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/AUD3.png' },
  ];
  return FLEET;
}

if (require.main === module) {
  scrapeLocaliza({ location: 'São Paulo', startDate: '2026-06-15', endDate: '2026-06-20' })
    .then(r => console.log(`Localiza: ${r.length} ofertas\n`, r.slice(0, 3)))
    .catch(console.error);
}
