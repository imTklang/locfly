import type { Browser, BrowserContext } from 'playwright';
import { ScrapedOffer } from './types';

let _browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!_browser || !(_browser as Browser).isConnected()) {
    // Use Function() to bypass TypeScript's compile-time import()→require() transformation.
    // cloakbrowser is ESM-only; native dynamic import() works from CJS, but tsc compiles
    // await import() to require() when module:"CommonJS", breaking ESM packages.
    type CloakMod = { launch: (opts?: Record<string, unknown>) => Promise<Browser> };
    const { launch } = await (new Function('return import("cloakbrowser")')() as Promise<CloakMod>);
    _browser = await launch({
      headless: true,
      locale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      humanize: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }
  return _browser!;
}

export async function newContext(): Promise<BrowserContext> {
  const browser = await getBrowser();
  return browser.newContext({
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: {
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  });
}

export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await (_browser as Browser).close();
    _browser = null;
  }
}

// ── JSON response mining helpers ────────────────────────────────────────────

const PRICE_KEYS = [
  'price', 'preco', 'valor', 'diaria', 'dailyRate', 'rate',
  'totalPrice', 'amount', 'tarifa', 'valorDiaria', 'baseRate',
  'estimatedTotalAmount', 'valorTotal', 'precoTotal', 'vlrDiaria',
  'vlr_diaria', 'price_per_day', 'dailyPrice',
];

const MODEL_KEYS = [
  'model', 'modelo', 'description', 'descricao', 'name', 'nome',
  'vehicleName', 'groupDescription', 'make', 'vehicleDescription',
  'carName', 'nomeVeiculo', 'nomeModelo', 'modelName', 'grupoDescricao',
  'grupo', 'groupName',
];

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
    if (json.length > 0 && hasPrice(json[0])) return json as Record<string, unknown>[];
    // recurse into first element if it's an object
    if (json.length > 0 && typeof json[0] === 'object') {
      return findVehicleArray(json[0]);
    }
    return null;
  }

  const o = json as Record<string, unknown>;
  const ARRAY_KEYS = [
    'vehicles', 'veiculos', 'result', 'results', 'data', 'items',
    'cars', 'carGroups', 'vehicleGroups', 'grupos', 'fleet', 'carros',
    'list', 'lista', 'content', 'payload', 'response', 'offers',
    'availabilities', 'availableVehicles', 'veiculosDisponiveis',
  ];

  for (const key of ARRAY_KEYS) {
    const val = o[key];
    if (Array.isArray(val) && val.length > 0 && hasPrice(val[0])) return val as Record<string, unknown>[];
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

  const catRaw = String(
    v.category || v.categoria || v.group || v.grupo || v.sipp || v.sipc ||
    v.groupCode || v.codigoGrupo || v.tipo || ''
  );
  const transRaw = String(v.transmission || v.cambio || v.transmissao || v.transmissionType || '');
  const trans = /auto|cvt|atm/i.test(transRaw) ? 'Automático' : transRaw || 'Manual';
  const seats = parseInt(String(v.seats || v.passageiros || v.passengers || v.passengerQuantity || 5)) || 5;
  const image = String(v.imageUrl || v.imagem || v.foto || v.image || v.imageURL || v.photo || v.fotoUrl || '');

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
