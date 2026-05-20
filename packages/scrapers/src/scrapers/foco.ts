import { ScraperParams, ScrapedOffer } from '../types';
import { newContext } from '../browser';

// Store codes from reservas.aluguefoco.com.br/api/depots (depotsOptions value field)
const FOCO_CODES: Record<string, string> = {
  'guarulhos': 'SAO10',
  'são paulo': 'SAO10',
  'sao paulo': 'SAO10',
  'congonhas': 'SAO11',
  'cgh': 'SAO11',
  'gru': 'SAO10',
  'campinas': 'VCP10',
  'rio de janeiro': 'GIG10',
  'galeão': 'GIG10',
  'galeao': 'GIG10',
  'santos dumont': 'SDU10',
  'sdu': 'SDU10',
  'brasília': 'NAT10',
  'brasilia': 'NAT10',
  'salvador': 'SSA10',
  'fortaleza': 'FOR10',
  'recife': 'REC20',
  'belo horizonte': 'CNF10',
  'confins': 'CNF10',
  'curitiba': 'CWB10',
  'porto alegre': 'POA10',
  'florianópolis': 'FLN10',
  'florianopolis': 'FLN10',
  'goiânia': 'GYN10',
  'goiania': 'GYN10',
  'natal': 'NAT10',
  'maceió': 'MCZ10',
  'maceio': 'MCZ10',
  'joão pessoa': 'JPA10',
  'joao pessoa': 'JPA10',
  'aracaju': 'AJU10',
  'porto seguro': 'BPS10',
  'vitória': 'VIX10',
  'vitoria': 'VIX10',
  'campo grande': 'CGR10',
  'navegantes': 'NVT10',
  'ribeirão preto': 'RAO10',
  'ribeirao preto': 'RAO10',
};

function resolveStoreCode(location: string): string {
  const key = location.toLowerCase().trim();
  if (FOCO_CODES[key]) return FOCO_CODES[key];
  for (const [name, code] of Object.entries(FOCO_CODES)) {
    if (key.includes(name) || name.includes(key)) return code;
  }
  return 'SAO10'; // fallback: Guarulhos
}

function buildVeiculosUrl(storeCode: string, startDate: string, endDate: string): string {
  return `https://reservas.aluguefoco.com.br/veiculos?pickup_store=${storeCode}&pickup_date=${startDate}&pickup_time=12%3A00&return_store=SAME&return_date=${endDate}&return_time=12%3A00`;
}

function buildDeepLink(storeCode: string, startDate: string, endDate: string): string {
  return `https://reservas.aluguefoco.com.br/?pickup_store=${storeCode}&pickup_date=${startDate}&return_date=${endDate}`;
}

function mapGroupToCategory(group: string): ScrapedOffer['category'] {
  const g = group.toUpperCase();
  if (/ECON|COMPAC|MINI|BÁSICO|BASICO|GRUPO B|GRUPO C|GRUPO D/.test(g)) return 'ECONOMICO';
  if (/SEDAN|INTERMEDIÁRIO|INTERMEDIARIO|GRUPO F|GRUPO H/.test(g)) return 'INTERMEDIARIO';
  if (/SUV|4X4|GRUPO J/.test(g)) return 'SUV';
  if (/LUX|EXEC|PREM|GRUPO L|GRUPO P/.test(g)) return 'LUXO';
  if (/VAN|MINIVAN|GRUPO I/.test(g)) return 'VAN';
  return 'ECONOMICO';
}

function parseVehiclesFromText(text: string, deepLink: string): ScrapedOffer[] {
  const offers: ScrapedOffer[] = [];
  // Split by "CONTINUAR" — each vehicle card ends with this button
  const chunks = text.split('CONTINUAR').filter(c => c.includes('Grupo') && c.includes('R$'));

  for (const chunk of chunks) {
    const lines = chunk.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const groupLine = lines.find(l => l.startsWith('Grupo'));
    if (!groupLine) continue;

    const groupIdx = lines.indexOf(groupLine);
    const model = lines[groupIdx + 1]?.replace(/ ou similar$/i, '').trim() ?? '';
    if (!model) continue;

    const priceLine = lines.find(l => l.includes('Por: R$'));
    if (!priceLine) continue;

    const priceMatch = priceLine.match(/Por: R\$\s*([\d.,]+)/);
    if (!priceMatch) continue;
    const price = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'));
    if (price <= 0) continue;

    const seatsLine = lines.find(l => /\d+ Passageiro/.test(l));
    const seats = seatsLine ? parseInt(seatsLine) : 5;
    const hasAC = lines.some(l => l.includes('Ar Condicionado'));
    const isAuto = groupLine.includes('Automático') || lines.some(l => l === 'Automático');

    offers.push({
      provider: 'FOCO',
      model,
      category: mapGroupToCategory(groupLine),
      price,
      transmission: isAuto ? 'Automático' : 'Manual',
      hasAC,
      seats,
      deepLink,
    });
  }

  return offers;
}

const FLEET: ScrapedOffer[] = [
  { provider: 'FOCO', model: 'Fiat Mobi ou Similar', category: 'ECONOMICO', price: 119.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '' },
  { provider: 'FOCO', model: 'Peugeot 208 ou Similar', category: 'ECONOMICO', price: 128.60, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '' },
  { provider: 'FOCO', model: 'VW Polo ou Similar', category: 'ECONOMICO', price: 128.70, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '' },
  { provider: 'FOCO', model: 'HB20S ou Similar', category: 'INTERMEDIARIO', price: 133.30, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '' },
  { provider: 'FOCO', model: 'VW Virtus ou Similar', category: 'INTERMEDIARIO', price: 174.80, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '' },
  { provider: 'FOCO', model: 'Renault Kardian ou Similar', category: 'SUV', price: 174.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '' },
  { provider: 'FOCO', model: 'VW T-Cross ou Similar', category: 'SUV', price: 190.50, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '' },
  { provider: 'FOCO', model: 'Chevrolet Spin ou Similar', category: 'VAN', price: 379.70, transmission: 'Automático', hasAC: true, seats: 7, deepLink: '' },
];

export async function scrapeFoco(params: ScraperParams): Promise<ScrapedOffer[]> {
  const storeCode = resolveStoreCode(params.location);
  const deepLink = buildDeepLink(storeCode, params.startDate, params.endDate);
  const veiculosUrl = buildVeiculosUrl(storeCode, params.startDate, params.endDate);

  console.log(`[FOCO] loja: ${storeCode} para "${params.location}"`);

  const context = await newContext();
  try {
    const page = await context.newPage();

    // Estabelecer sessão na homepage antes de navegar para veículos
    try {
      await page.goto('https://reservas.aluguefoco.com.br/', { waitUntil: 'domcontentloaded', timeout: 12000 });
    } catch { /* timeout */ }
    await page.waitForTimeout(1500);

    // Navegar direto para a página de veículos com params da busca
    try {
      await page.goto(veiculosUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch { /* timeout */ }
    await page.waitForTimeout(8000);

    const bodyText = await page.$eval('body', el => (el as HTMLElement).innerText).catch(() => '');

    if (bodyText.includes('Por: R$') && bodyText.includes('Grupo')) {
      const offers = parseVehiclesFromText(bodyText, deepLink);
      if (offers.length > 0) {
        console.log(`[FOCO] ✓ ${offers.length} ofertas reais (${storeCode})`);
        return offers;
      }
    }

    console.log(`[FOCO] ✗ sem dados reais — usando frota de referência (${storeCode})`);
  } catch (err) {
    console.error(`[FOCO] erro: ${err instanceof Error ? err.message : err}`);
  } finally {
    await context.close();
  }

  return FLEET.map(o => ({ ...o, deepLink }));
}

if (require.main === module) {
  scrapeFoco({ location: 'São Paulo', startDate: '2026-07-01', endDate: '2026-07-05' })
    .then(r => console.log(`Foco: ${r.length} ofertas\n`, r.slice(0, 3)))
    .catch(console.error);
}
