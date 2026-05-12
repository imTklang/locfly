import { chromium, Browser, BrowserContext } from 'playwright';
import { ScrapedOffer } from './types';

let _browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!_browser || !_browser.isConnected()) {
    _browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    });
  }
  return _browser;
}

export async function newContext(): Promise<BrowserContext> {
  const browser = await getBrowser();
  return browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: {
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
  });
}

export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}

// ── JSON response mining helpers ────────────────────────────────────────────

const PRICE_KEYS = ['price', 'preco', 'valor', 'diaria', 'dailyRate', 'rate',
  'totalPrice', 'amount', 'tarifa', 'valorDiaria', 'baseRate', 'estimatedTotalAmount'];
const MODEL_KEYS = ['model', 'modelo', 'description', 'descricao', 'name', 'nome',
  'vehicleName', 'groupDescription', 'make', 'vehicleDescription', 'carName'];

function hasPrice(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return PRICE_KEYS.some(k => {
    const v = o[k];
    return typeof v === 'number' ? v > 0 : (typeof v === 'string' && parseFloat(v) > 0);
  });
}

export function findVehicleArray(json: unknown): Record<string, unknown>[] | null {
  if (!json || typeof json !== 'object') return null;

  if (Array.isArray(json)) {
    if (json.length > 0 && hasPrice(json[0])) return json;
    return null;
  }

  const o = json as Record<string, unknown>;
  const ARRAY_KEYS = ['vehicles', 'veiculos', 'result', 'results', 'data', 'items',
    'cars', 'carGroups', 'vehicleGroups', 'grupos', 'fleet', 'carros'];

  for (const key of ARRAY_KEYS) {
    const val = o[key];
    if (Array.isArray(val) && val.length > 0 && hasPrice(val[0])) return val;
    // nested: { data: { vehicles: [...] } }
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const inner = findVehicleArray(val);
      if (inner) return inner;
    }
  }

  return null;
}

export function rawToOffer(
  v: Record<string, unknown>,
  provider: ScrapedOffer['provider'],
  deepLink: string,
  mapCategory: (s: string) => ScrapedOffer['category'],
): ScrapedOffer | null {
  const modelRaw = MODEL_KEYS.map(k => v[k]).find(x => typeof x === 'string' && (x as string).trim());
  const model = String(modelRaw || '').trim();

  const priceRaw = PRICE_KEYS.map(k => v[k]).find(x => x !== undefined && x !== null);
  const price = typeof priceRaw === 'number'
    ? priceRaw
    : parseFloat(String(priceRaw || '0').replace(/[^0-9,.]/g, '').replace(',', '.'));

  if (!model || price <= 0) return null;

  const catRaw = String(v.category || v.categoria || v.group || v.grupo || v.sipp || v.sipc || v.groupCode || '');
  const transRaw = String(v.transmission || v.cambio || v.transmissao || v.transmissionType || '');
  const trans = /auto|cvt|atm/i.test(transRaw) ? 'Automático' : transRaw || 'Manual';
  const seats = parseInt(String(v.seats || v.passageiros || v.passengers || v.passengerQuantity || 5)) || 5;
  const image = String(v.imageUrl || v.imagem || v.foto || v.image || v.imageURL || v.photo || '');

  return {
    provider,
    model,
    category: mapCategory(catRaw),
    price,
    transmission: trans,
    hasAC: true,
    seats,
    deepLink,
    imageUrl: image || undefined,
  };
}
