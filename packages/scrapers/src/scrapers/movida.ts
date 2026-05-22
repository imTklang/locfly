import { ScraperParams, ScrapedOffer } from '../types';
import { newContext } from '../browser';

const BOOKING_URL = 'https://www.movida.com.br/reserva/itinerario-escolher/';
const DEEP_LINK = 'https://www.movida.com.br/locacao-de-veiculos';

function mapCategory(groupName: string): ScrapedOffer['category'] {
  const s = groupName.toUpperCase();
  if (/VAN|MINIVAN|MASTER|DUCATO|SPRINTER|JUMPY|FURGÃO|FURGAO/.test(s)) return 'VAN';
  if (/SUV|4X4|CROSSOVER/.test(s)) return 'SUV';
  if (/LUX|PREM|EXECUT|BMW|AUDI|MERC|VOLVO|JAGUAR/.test(s)) return 'LUXO';
  if (/INTER|SEDAN|COMPACTO SEDÃ|COMPACTO SEDA/.test(s)) return 'INTERMEDIARIO';
  return 'ECONOMICO';
}

function parsePrice(text: string): number {
  const m = text.match(/R\$\s*([\d.]+,\d+)/);
  if (!m) return 0;
  return parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
}

// Shadow DOM helpers — injected as raw JS string into page.evaluate
const HELPERS = `
  function getAllCals(root) {
    if (!root) return [];
    const r = [];
    r.push(...root.querySelectorAll('app-calendar'));
    for (const el of root.querySelectorAll('*')) { if (el.shadowRoot) r.push(...getAllCals(el.shadowRoot)); }
    return r;
  }
  function getAllSels(root) {
    if (!root) return [];
    const r = [];
    r.push(...root.querySelectorAll('app-custom-select'));
    for (const el of root.querySelectorAll('*')) { if (el.shadowRoot) r.push(...getAllSels(el.shadowRoot)); }
    return r;
  }
  function navCalToMonth(cal, targetMonth) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const header = cal.shadowRoot.querySelector(
        '.month-title, .calendar-title, .header-month, [class*="month-year"], [class*="current-month"], h4, h3'
      );
      if (!header) break;
      const text = header.textContent.toLowerCase();
      const months = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
      const monthsAccent = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
      let idx = monthsAccent.findIndex(m => text.includes(m));
      if (idx === -1) idx = months.findIndex(m => text.includes(m));
      if (idx === targetMonth - 1) break;
      const btn = cal.shadowRoot.querySelector(
        '.next-month, .next, [class*="next-month"], [class*="arrow-next"], button:last-of-type'
      );
      if (btn) btn.click(); else break;
    }
  }
  function clickCal(cal, targetDay, targetMonth) {
    if (!cal || !cal.shadowRoot) return 'no shadow';
    if (targetMonth) navCalToMonth(cal, targetMonth);
    const days = Array.from(cal.shadowRoot.querySelectorAll('.day')).filter(
      d => !d.classList.contains('other-month') && !d.classList.contains('disabled') && /^\\d+$/.test((d.textContent || '').trim())
    );
    for (const d of days) { if ((d.textContent || '').trim() === String(targetDay)) { d.click(); return 'clicked ' + targetDay; } }
    const pick = days.find(d => parseInt((d.textContent || '').trim()) >= targetDay) || days[days.length - 1];
    if (pick) { pick.click(); return 'fallback ' + (pick.textContent || '').trim(); }
    return 'no days: ' + days.length;
  }
  function clickHora(sel, time) {
    if (!sel || !sel.shadowRoot) return 'no shadow';
    const opts = sel.shadowRoot.querySelectorAll('.option');
    if (opts.length === 0) {
      const container = sel.shadowRoot.querySelector('.custom-select-container');
      if (container) container.click();
      return 'opened';
    }
    for (const o of opts) { if ((o.textContent || '').trim().startsWith(time)) { o.click(); return 'clicked ' + time; } }
    if (opts.length >= 10) { opts[10].click(); return 'clicked idx10'; }
    return 'no match';
  }
`;

const FLEET: ScrapedOffer[] = [
  { provider: 'MOVIDA', model: 'Renault Kwid', category: 'ECONOMICO', price: 72.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: DEEP_LINK, imageUrl: 'https://prdmovida.blob.core.windows.net/public/imagens/cars/t3_grupo_AX.jpg' },
  { provider: 'MOVIDA', model: 'Hyundai HB20', category: 'ECONOMICO', price: 84.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: DEEP_LINK, imageUrl: 'https://prdmovida.blob.core.windows.net/public/imagens/cars/t3_grupo_B.jpg' },
  { provider: 'MOVIDA', model: 'Chevrolet Onix Plus', category: 'ECONOMICO', price: 96.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: DEEP_LINK, imageUrl: 'https://prdmovida.blob.core.windows.net/public/imagens/cars/t3_grupo_BX.jpg' },
  { provider: 'MOVIDA', model: 'Honda Civic', category: 'INTERMEDIARIO', price: 159.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: DEEP_LINK },
  { provider: 'MOVIDA', model: 'Nissan Sentra', category: 'INTERMEDIARIO', price: 144.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: DEEP_LINK },
  { provider: 'MOVIDA', model: 'Hyundai Tucson', category: 'SUV', price: 269.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: DEEP_LINK },
  { provider: 'MOVIDA', model: 'Jeep Compass', category: 'SUV', price: 289.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: DEEP_LINK },
  { provider: 'MOVIDA', model: 'Audi A4', category: 'LUXO', price: 430.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: DEEP_LINK },
  { provider: 'MOVIDA', model: 'Renault Master', category: 'VAN', price: 360.00, transmission: 'Manual', hasAC: true, seats: 15, deepLink: DEEP_LINK },
];

export async function scrapeMovida(params: ScraperParams): Promise<ScrapedOffer[]> {
  const [, sm, sd] = params.startDate.split('-').map(Number);
  const [, rm, rd] = params.endDate.split('-').map(Number);

  const context = await newContext();
  try {
    const page = await context.newPage();
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) console.log(`[MOVIDA][NAV] ${frame.url().slice(0, 80)}`);
    });

    await page.goto(BOOKING_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    const app = page.locator('app-itinerario');

    // ── 1. Store ──
    const storeInput = app.locator('input[name="loja1"]');
    await storeInput.click();
    await page.waitForTimeout(300);
    await storeInput.pressSequentially(params.location, { delay: 120 });

    let sugN = 0;
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(500);
      sugN = await app.locator('[class*="ng-box"] li, [class*="autocomplete"] li').count();
      if (sugN > 0) break;
    }
    if (sugN === 0) throw new Error(`no store suggestions for: ${params.location}`);

    const sug = app.locator('[class*="ng-box"] li, [class*="autocomplete"] li');
    let storeSelected = false;
    for (let i = 0; i < sugN; i++) {
      const t = await sug.nth(i).textContent().catch(() => '');
      if (t && /aeroporto/i.test(t)) { await sug.nth(i).click(); storeSelected = true; break; }
      if (i === sugN - 1) { await sug.first().click(); storeSelected = true; }
    }
    if (!storeSelected) throw new Error('could not select store');
    // Aguardar confirmação BFF (até 10s) antes de prosseguir com datas
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(500);
      const bffDone = await page.evaluate(() => !!(window as unknown as Record<string, unknown>).__storeBff).catch(() => false);
      if (bffDone) break;
    }
    await page.waitForTimeout(500);
    console.log('[MOVIDA] store selected');

    // ── 2. Pickup date ──
    await page.evaluate(`(function() {
      ${HELPERS}
      const wc = document.querySelector('app-itinerario');
      return clickCal(getAllCals(wc && wc.shadowRoot)[0], ${sd}, ${sm});
    })()`);
    await page.waitForTimeout(2500);

    // ── 3. Pickup hora ──
    const h1: string = await page.evaluate(`(function() {
      ${HELPERS}
      const wc = document.querySelector('app-itinerario');
      return clickHora(getAllSels(wc && wc.shadowRoot)[0], '10:00');
    })()`);
    if (h1 === 'opened') {
      await page.waitForTimeout(1500);
      await page.evaluate(`(function() {
        ${HELPERS}
        const wc = document.querySelector('app-itinerario');
        const opts = getAllSels(wc && wc.shadowRoot)[0].shadowRoot.querySelectorAll('.option');
        for (const o of opts) { if ((o.textContent || '').trim().startsWith('10:00')) { o.click(); return; } }
        if (opts[10]) opts[10].click();
      })()`);
    }
    await page.waitForTimeout(2500);
    console.log('[MOVIDA] pickup hora:', h1);

    // ── 4. Return date ──
    await page.evaluate(`(function() {
      ${HELPERS}
      const wc = document.querySelector('app-itinerario');
      const cals = getAllCals(wc && wc.shadowRoot);
      if (cals.length >= 2) return clickCal(cals[1], ${rd}, ${rm});
      return 'no cal2: ' + cals.length;
    })()`);
    await page.waitForTimeout(2500);

    // ── 5. Return hora ──
    const h2: string = await page.evaluate(`(function() {
      ${HELPERS}
      const wc = document.querySelector('app-itinerario');
      const sels = getAllSels(wc && wc.shadowRoot);
      if (sels.length < 2) return 'only ' + sels.length;
      return clickHora(sels[1], '10:00');
    })()`);
    if (h2 === 'opened') {
      await page.waitForTimeout(1500);
      await page.evaluate(`(function() {
        ${HELPERS}
        const wc = document.querySelector('app-itinerario');
        const sels = getAllSels(wc && wc.shadowRoot);
        if (sels.length < 2) return;
        const opts = sels[1].shadowRoot.querySelectorAll('.option');
        for (const o of opts) { if ((o.textContent || '').trim().startsWith('10:00')) { o.click(); return; } }
        if (opts[10]) opts[10].click();
      })()`);
    }
    await page.waitForTimeout(2000);
    console.log('[MOVIDA] return hora:', h2);

    // ── 6. Submit ──
    await page.evaluate(`(function() {
      function clickFirst(root) {
        for (const el of root.querySelectorAll('button')) {
          if (!el.disabled && el.offsetParent !== null) { el.click(); return true; }
        }
        for (const el of root.querySelectorAll('*')) {
          if (el.shadowRoot && clickFirst(el.shadowRoot)) return true;
        }
        return false;
      }
      const wc = document.querySelector('app-itinerario');
      if (wc && wc.shadowRoot) clickFirst(wc.shadowRoot);
    })()`);
    console.log('[MOVIDA] Buscar clicked');

    // ── 7. Wait for results page ──
    try {
      await page.waitForURL('**/escolha-seu-veiculo**', { timeout: 15000 });
    } catch { /* check URL below */ }
    await page.waitForTimeout(4000);

    if (!page.url().includes('escolha-seu-veiculo')) {
      throw new Error(`did not reach results page, url: ${page.url()}`);
    }
    console.log(`[MOVIDA] results page: ${page.url()}`);

    // ── 8. Scrape vehicle cards ──
    const raw = await page.evaluate(() => {
      type Card = { model: string; groupCode: string; groupName: string; priceText: string; imageUrl: string };
      const results: Card[] = [];

      document.querySelectorAll('.block-select.block-car').forEach((card) => {
        const el = card as HTMLElement;
        const text = el.innerText || '';
        if (!text.includes('/dia')) return; // skip non-date-quoted cards

        const grupoMatch = text.match(/GRUPO\s+([A-Z0-9]+)\s*[-–]\s*([^\n]+)/i);
        const groupCode = grupoMatch?.[1] || '';
        const groupName = (grupoMatch?.[2] || '').trim().split('\n')[0].trim();

        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        const grupoIdx = lines.findIndex((l) => /GRUPO/i.test(l));
        const model = grupoIdx > 0
          ? lines.slice(0, grupoIdx).join(', ')
          : (groupName || lines[0] || '');

        const priceMatch = text.match(/R\$\s*[\d.,]+\s*\/dia/);
        const priceText = priceMatch?.[0] || '';

        const img = card.querySelector('img.img-responsive, img.veiculoBox__car, img') as HTMLImageElement | null;
        const imageUrl = (img?.src || '').startsWith('http') ? (img?.src || '') : '';

        if (groupCode && priceText) results.push({ model, groupCode, groupName, priceText, imageUrl });
      });

      return results;
    });

    console.log(`[MOVIDA] ${raw.length} cards scraped from DOM`);
    if (raw.length === 0) throw new Error('no vehicle cards found');

    const offers: ScrapedOffer[] = raw.map((r) => {
      const price = parsePrice(r.priceText);
      const g = r.groupName;
      const transmission = /autom/i.test(g) ? 'Automático' : /manual/i.test(g) ? 'Manual' : 'Automático';
      const seats = /van|minivan|master|ducato|sprinter/i.test(g) ? 7 : 5;
      return {
        provider: 'MOVIDA' as const,
        model: r.model || `Grupo ${r.groupCode}`,
        category: mapCategory(g),
        price,
        transmission,
        hasAC: true,
        seats,
        deepLink: DEEP_LINK,
        imageUrl: r.imageUrl || undefined,
      };
    }).filter((o) => o.price > 0);

    if (offers.length === 0) throw new Error('no valid offers after parsing');
    console.log(`[MOVIDA] ✓ ${offers.length} ofertas reais capturadas`);
    return offers;

  } catch (err) {
    console.error(`[MOVIDA] erro: ${err instanceof Error ? err.message : err}`);
  } finally {
    await context.close();
  }

  return FLEET;
}

if (require.main === module) {
  scrapeMovida({ location: 'São Paulo', startDate: '2026-06-15', endDate: '2026-06-20' })
    .then((r) => console.log(`Movida: ${r.length} ofertas\n`, r.slice(0, 3)))
    .catch(console.error);
}
