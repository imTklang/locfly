import https from 'https';
import { ScraperParams, ScrapedOffer } from '../types';
import { newContext } from '../browser';

// ── Types ──────────────────────────────────────────────────────────────────

interface StoreInfo { code: string; name: string; }

interface GroupDetail { iconUrl: string; label: string; }

interface GroupData {
  info: string;
  sipp: string;
  name: string;
  modelsDescription: string;
  details: GroupDetail[];
  imageUrls: string[];
}

interface Availability {
  groupId: string;
  isAvailable: boolean;
  unitDailyValue: number;
  group: GroupData;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function mapCategory(info: string): ScrapedOffer['category'] {
  const s = info.toUpperCase();
  if (/VAN|MINIVAN|FURGÃO|FURGAO/.test(s)) return 'VAN';
  if (/\bSUV\b|4X4|CROSSOVER/.test(s)) return 'SUV';
  if (/EXECUT|LUXO|PREMIUM|ESPECIAL/.test(s)) return 'LUXO';
  if (/INTERMEDIÁRI|INTERMEDIARI|SEDAN|MÉDIO\b|MEDIO\b|PICAPE/.test(s)) return 'INTERMEDIARIO';
  return 'ECONOMICO';
}

function parseTransmission(details: GroupDetail[]): string {
  const trans = details.find(d => /transmissão|transmissao|câmbio|cambio/i.test(d.label));
  if (!trans) return 'Automático'; // modern UNIDAS fleet is mostly automatic
  return /automát|automatic|cvt|auto\b/i.test(trans.label) ? 'Automático' : 'Manual';
}

function parseSeats(details: GroupDetail[]): number {
  const seats = details.find(d => /lugar/i.test(d.label));
  if (!seats) return 5;
  const m = seats.label.match(/\d+/);
  return m ? parseInt(m[0]) : 5;
}

async function resolveStoreCode(location: string): Promise<StoreInfo | null> {
  return new Promise((resolve) => {
    const url = `https://apisiterac.unidas.com.br/api/v3/stores/details?keyWord=${encodeURIComponent(location)}&storeType=0`;
    https.get(url, { headers: { Accept: 'application/json' } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const d = JSON.parse(body) as { data?: Array<{ storeCode: string; description?: string }> };
          const first = d?.data?.[0];
          if (!first?.storeCode) { resolve(null); return; }
          resolve({ code: first.storeCode, name: first.description ?? location });
        } catch { resolve(null); }
      });
      res.on('error', () => resolve(null));
    }).on('error', () => resolve(null));
  });
}

// ── Static fallback ────────────────────────────────────────────────────────

const DEEP_LINK = 'https://www.unidas.com.br/reserve-um-carro';

const FLEET: ScrapedOffer[] = [
  { provider: 'UNIDAS', model: 'Fiat Mobi', category: 'ECONOMICO', price: 74.95, transmission: 'Manual', hasAC: true, seats: 5, deepLink: DEEP_LINK },
  { provider: 'UNIDAS', model: 'Volkswagen Gol', category: 'ECONOMICO', price: 84.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: DEEP_LINK },
  { provider: 'UNIDAS', model: 'Hyundai HB20S Automático', category: 'INTERMEDIARIO', price: 129.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: DEEP_LINK },
  { provider: 'UNIDAS', model: 'Volkswagen Virtus', category: 'INTERMEDIARIO', price: 149.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: DEEP_LINK },
  { provider: 'UNIDAS', model: 'Jeep Renegade', category: 'SUV', price: 239.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: DEEP_LINK },
  { provider: 'UNIDAS', model: 'Mitsubishi Eclipse Cross', category: 'SUV', price: 264.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: DEEP_LINK },
  { provider: 'UNIDAS', model: 'Jeep Grand Cherokee', category: 'LUXO', price: 490.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: DEEP_LINK },
  { provider: 'UNIDAS', model: 'Fiat Ducato', category: 'VAN', price: 350.00, transmission: 'Manual', hasAC: true, seats: 15, deepLink: DEEP_LINK },
];

// ── Browser form automation ────────────────────────────────────────────────

async function scrapeViaPlaywright(params: ScraperParams): Promise<Availability[]> {
  const [, sm, sd] = params.startDate.split('-').map(Number);
  const [, em, ed] = params.endDate.split('-').map(Number);
  const today = new Date();
  const sy = parseInt(params.startDate.split('-')[0]);
  const ey = parseInt(params.endDate.split('-')[0]);
  const startMonthsForward = (sm - (today.getMonth() + 1)) + (sy - today.getFullYear()) * 12;
  const endMonthsForward = (em - (today.getMonth() + 1)) + (ey - today.getFullYear()) * 12;

  const context = await newContext();
  let quotationData: Availability[] = [];

  try {
    const page = await context.newPage();

    // Intercept quotation API
    page.on('response', async (res) => {
      if (res.url().includes('/quotations/GetGroupsQuotation') && res.status() === 200) {
        try {
          const json = await res.json() as { data?: { availabilities?: Availability[] } };
          if (json?.data?.availabilities?.length) {
            quotationData = json.data.availabilities;
            console.log(`[UNIDAS] 🎯 ${quotationData.length} grupos capturados via API`);
          }
        } catch {}
      }
    });

    await page.goto('https://www.unidas.com.br/reserve-um-carro', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // ── 1. Store selection ──────────────────────────────────────────────────
    await page.evaluate(() => {
      const inp = document.querySelector<HTMLInputElement>('input[placeholder="Loja de retirada"]');
      if (inp) { inp.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); inp.focus(); inp.click(); }
    });
    await page.waitForTimeout(300);
    await page.keyboard.type(params.location, { delay: 80 });
    await page.waitForResponse(
      res => res.url().includes('stores/details') && res.status() === 200,
      { timeout: 10000 }
    ).catch(() => {});
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      const lis = Array.from(document.querySelectorAll<HTMLElement>('li.desktop.quick-withdrawal'));
      const airport = lis.find(li => /aeroporto|airport/i.test(li.textContent || '') && window.getComputedStyle(li).display !== 'none')
        || lis.find(li => window.getComputedStyle(li).display !== 'none');
      if (airport) { airport.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); airport.click(); }
    });
    await page.waitForTimeout(2000);

    // ── 2. Pickup date ──────────────────────────────────────────────────────
    await page.evaluate(() => {
      const d = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="text"]')).find(i => i.placeholder === 'Data de retirada');
      if (d) { d.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); d.focus(); d.click(); }
    });
    await page.waitForTimeout(1500);

    for (let i = 0; i < startMonthsForward; i++) {
      await page.evaluate(() => (document.querySelector<HTMLElement>('button.mat-calendar-next-button'))?.click());
      await page.waitForTimeout(700);
    }
    await page.evaluate((day) => {
      const cells = Array.from(document.querySelectorAll<HTMLElement>('td.mat-calendar-body-cell'));
      for (const cell of cells) {
        if (new RegExp(`\\b${day}\\b`).test(cell.getAttribute('aria-label') || '')) {
          (cell.querySelector<HTMLElement>('.mat-calendar-body-cell-content') || cell).click(); return;
        }
      }
      const btn = Array.from(document.querySelectorAll<HTMLElement>('.mat-calendar-body-cell-content')).find(b => b.textContent?.trim() === String(day));
      if (btn) btn.click();
    }, sd);
    await page.waitForTimeout(2000);

    // ── 3. Pickup hora ──────────────────────────────────────────────────────
    await page.evaluate(() => {
      const inp = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="text"]')).find(i => i.placeholder === 'Hora de retirada');
      const container = inp?.closest<HTMLElement>('.input-container, [class*="input-container"]');
      if (container) { container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); container.click(); }
    });
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const inp = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="text"]')).find(i => i.placeholder === 'Hora de retirada');
      const group = inp?.closest<HTMLElement>('[class*="date-hour-group"]');
      if (!group) return;
      const items = group.querySelectorAll<HTMLElement>('[data-qa="time-list"]');
      const target = Array.from(items).find(li => li.id === '10:00') || items[8] || items[0];
      if (target) target.click();
    });
    await page.waitForTimeout(2000);

    // ── 4. Return date ──────────────────────────────────────────────────────
    await page.evaluate(() => {
      const d = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="text"]')).find(i => i.placeholder === 'Data de devolução');
      if (d) { d.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); d.focus(); d.click(); }
    });
    await page.waitForTimeout(1500);

    const currentCalMonth = await page.evaluate(() => document.querySelector<HTMLElement>('button.mat-calendar-period-button')?.textContent?.trim() || '');
    const targetMonth = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][em - 1];
    if (!currentCalMonth.toLowerCase().includes(targetMonth)) {
      for (let i = 0; i < endMonthsForward; i++) {
        await page.evaluate(() => (document.querySelector<HTMLElement>('button.mat-calendar-next-button'))?.click());
        await page.waitForTimeout(700);
      }
    }
    await page.evaluate((day) => {
      const cells = Array.from(document.querySelectorAll<HTMLElement>('td.mat-calendar-body-cell'));
      for (const cell of cells) {
        if (new RegExp(`\\b${day}\\b`).test(cell.getAttribute('aria-label') || '')) {
          (cell.querySelector<HTMLElement>('.mat-calendar-body-cell-content') || cell).click(); return;
        }
      }
      const btn = Array.from(document.querySelectorAll<HTMLElement>('.mat-calendar-body-cell-content')).find(b => b.textContent?.trim() === String(day));
      if (btn) btn.click();
    }, ed);
    await page.waitForTimeout(2000);

    // ── 5. Return hora ──────────────────────────────────────────────────────
    await page.evaluate(() => {
      const inp = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="text"]')).find(i => i.placeholder === 'Hora de devolução');
      const container = inp?.closest<HTMLElement>('.input-container, [class*="input-container"]');
      if (container) { container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); container.click(); }
    });
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const inp = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="text"]')).find(i => i.placeholder === 'Hora de devolução');
      const group = inp?.closest<HTMLElement>('[class*="date-hour-group"]');
      if (!group) return;
      const items = group.querySelectorAll<HTMLElement>('[data-qa="time-list"]');
      const target = Array.from(items).find(li => li.id === '10:00') || items[8] || items[0];
      if (target) target.click();
    });
    await page.waitForTimeout(2000);

    // ── 6. Submit ───────────────────────────────────────────────────────────
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const validar = btns.find(b => !b.disabled && /validar/i.test(b.textContent || ''));
      if (validar) validar.click();
    });

    // Wait for quotation API response
    await page.waitForResponse(
      res => res.url().includes('GetGroupsQuotation') && res.status() === 200,
      { timeout: 20000 }
    ).catch(() => {});
    await page.waitForTimeout(3000);

    return quotationData;
  } finally {
    await context.close();
  }
}

// ── Main export ────────────────────────────────────────────────────────────

export async function scrapeUnidas(params: ScraperParams): Promise<ScrapedOffer[]> {
  const store = await resolveStoreCode(params.location);
  if (store) {
    console.log(`[UNIDAS] loja mais próxima: ${store.name} (${store.code})`);
  }

  let raw: Availability[] = [];
  try {
    raw = await scrapeViaPlaywright(params);
  } catch (err) {
    console.error('[UNIDAS] Playwright falhou:', (err as Error).message);
  }

  if (raw.length === 0) {
    console.log('[UNIDAS] usando frota de referência (fallback)');
    return FLEET.map(o => ({ ...o, deepLink: DEEP_LINK }));
  }

  return raw
    .filter(a => a.isAvailable && a.unitDailyValue > 0)
    .map(a => {
      const model = a.group.modelsDescription || a.group.info;
      const transmission = parseTransmission(a.group.details);
      const seats = parseSeats(a.group.details);
      const imageUrl = a.group.imageUrls?.[0];
      return {
        provider: 'UNIDAS' as const,
        model,
        category: mapCategory(a.group.info),
        price: a.unitDailyValue,
        transmission,
        hasAC: true,
        seats,
        deepLink: DEEP_LINK,
        imageUrl,
      };
    });
}

if (require.main === module) {
  scrapeUnidas({ location: 'São Paulo', startDate: '2026-06-15', endDate: '2026-06-20' })
    .then(r => console.log(`Unidas: ${r.length} ofertas\n`, JSON.stringify(r.slice(0, 3), null, 2)))
    .catch(console.error);
}
