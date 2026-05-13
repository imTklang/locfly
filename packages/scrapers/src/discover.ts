/**
 * Script de discovery: visita cada locadora e loga TODAS as respostas JSON.
 * Salva resultado em discover-output.json para análise manual dos endpoints reais.
 *
 * Uso: npx ts-node src/discover.ts [localiza|movida|unidas|hertz|foco]
 */
import * as fs from 'fs';
import { newContext, closeBrowser } from './browser';

const LOCATION = 'São Paulo';
const START = '2026-07-01';
const END = '2026-07-05';

interface CapturedRequest {
  url: string;
  method: string;
  postData?: string;
}

interface CapturedResponse {
  url: string;
  status: number;
  contentType: string;
  bodyPreview: string;
  hasPrice: boolean;
  timestamp: string;
}

interface SiteReport {
  site: string;
  requests: CapturedRequest[];
  jsonResponses: CapturedResponse[];
  errors: string[];
}

const PRICE_KEYS = [
  'price', 'preco', 'valor', 'diaria', 'dailyRate', 'rate', 'tarifa',
  'valorDiaria', 'baseRate', 'totalPrice', 'amount', 'vlrDiaria',
];

function looksLikeVehicleData(text: string): boolean {
  const lower = text.toLowerCase();
  const priceHit = PRICE_KEYS.some(k => lower.includes(k));
  const modelHit = ['veiculo', 'vehicle', 'modelo', 'model', 'carro', 'car', 'grupo'].some(k => lower.includes(k));
  return priceHit && modelHit;
}

const SITES: Array<{ name: string; url: string; formFill?: (page: import('playwright').Page) => Promise<void> }> = [
  {
    name: 'LOCALIZA',
    url: 'https://www.localiza.com/brazil/pt-br/aluguel-de-carros',
    formFill: async (page) => {
      try {
        // Tenta preencher campo de localização
        const locInput = await page.waitForSelector(
          'input[placeholder*="cidade"], input[placeholder*="local"], input[data-testid*="pickup"], input[aria-label*="local"]',
          { timeout: 8000 }
        );
        if (locInput) {
          await locInput.fill(LOCATION);
          await page.waitForTimeout(1500);
          // Tenta clicar primeira sugestão
          const suggestion = await page.$('[role="option"]:first-child, .suggestion:first-child, .autocomplete-item:first-child');
          if (suggestion) await suggestion.click();
          else await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        }
      } catch (e) {
        console.log('[LOCALIZA] form fill falhou:', String(e).slice(0, 100));
      }
    },
  },
  {
    name: 'MOVIDA',
    url: 'https://www.movida.com.br/locacao-de-veiculos',
    formFill: async (page) => {
      try {
        const locInput = await page.waitForSelector(
          'input[placeholder*="cidade"], input[placeholder*="local"], input[name*="origem"], input[name*="cidade"]',
          { timeout: 8000 }
        );
        if (locInput) {
          await locInput.fill(LOCATION);
          await page.waitForTimeout(1500);
          const suggestion = await page.$('[class*="suggestion"]:first-child, [class*="option"]:first-child, [role="option"]:first-child');
          if (suggestion) await suggestion.click();
          else await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        }
        // Tenta preencher data de retirada
        await page.fill('input[type="date"]:first-of-type, input[placeholder*="retirada"]', START).catch(() => {});
        await page.fill('input[type="date"]:last-of-type, input[placeholder*="devolu"]', END).catch(() => {});
        // Clica buscar
        await page.click('button[type="submit"], button:has-text("Buscar"), button:has-text("Ver")').catch(() => {});
        await page.waitForTimeout(4000);
      } catch (e) {
        console.log('[MOVIDA] form fill falhou:', String(e).slice(0, 100));
      }
    },
  },
  {
    name: 'UNIDAS',
    url: 'https://www.unidas.com.br/',
    formFill: async (page) => {
      try {
        await page.fill('input[name*="local"], input[placeholder*="local"], input[placeholder*="cidade"]', LOCATION).catch(() => {});
        await page.waitForTimeout(1000);
        await page.fill('input[name*="retirada"], input[type="date"]:first-of-type', START).catch(() => {});
        await page.fill('input[name*="devolucao"], input[type="date"]:last-of-type', END).catch(() => {});
        await page.click('button[type="submit"], button:has-text("Buscar"), button:has-text("Pesquisar")').catch(() => {});
        await page.waitForTimeout(4000);
      } catch (e) {
        console.log('[UNIDAS] form fill falhou:', String(e).slice(0, 100));
      }
    },
  },
  {
    name: 'HERTZ',
    url: 'https://www.hertz.com.br/',
  },
  {
    name: 'FOCO',
    url: 'https://www.focorental.com.br/',
  },
];

async function discoverSite(site: typeof SITES[0]): Promise<SiteReport> {
  const report: SiteReport = {
    site: site.name,
    requests: [],
    jsonResponses: [],
    errors: [],
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[DISCOVER] ${site.name} → ${site.url}`);

  const context = await newContext();
  try {
    const page = await context.newPage();

    // Captura todas as requisições
    page.on('request', (req) => {
      const method = req.method();
      if (method === 'POST' || req.url().includes('api') || req.url().includes('search')) {
        const entry: CapturedRequest = { url: req.url(), method };
        const pd = req.postData();
        if (pd) entry.postData = pd.slice(0, 200);
        report.requests.push(entry);
        console.log(`  → [REQ] ${method} ${req.url().slice(0, 100)}`);
      }
    });

    // Captura todas as respostas JSON
    page.on('response', async (res) => {
      try {
        const ct = res.headers()['content-type'] || '';
        if (!ct.includes('json')) return;

        const url = res.url();
        const status = res.status();
        let bodyText = '';

        try {
          bodyText = await res.text();
        } catch {
          return;
        }

        if (!bodyText || bodyText.length < 10) return;

        const hasPrice = looksLikeVehicleData(bodyText);
        const preview = bodyText.slice(0, 800);

        const entry: CapturedResponse = {
          url,
          status,
          contentType: ct,
          bodyPreview: preview,
          hasPrice,
          timestamp: new Date().toISOString(),
        };
        report.jsonResponses.push(entry);

        const tag = hasPrice ? '🎯 VEÍCULOS' : '   json';
        console.log(`  ← [${tag}] ${status} ${url.slice(0, 90)}`);
        if (hasPrice) {
          console.log(`     preview: ${preview.slice(0, 200)}`);
        }
      } catch { /* silent */ }
    });

    // Navega para o site
    try {
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      console.log(`  [✓] Página carregada`);
    } catch (e) {
      const msg = String(e).slice(0, 100);
      report.errors.push(`goto: ${msg}`);
      console.log(`  [✗] Erro ao carregar: ${msg}`);
    }

    await page.waitForTimeout(3000);

    // Preenche formulário se disponível
    if (site.formFill) {
      console.log(`  [form] Tentando preencher formulário...`);
      await site.formFill(page);
      await page.waitForTimeout(5000);
    }

    // Aguarda mais respostas
    await page.waitForTimeout(3000);

    console.log(`  [✓] ${site.name}: ${report.jsonResponses.length} respostas JSON, ${report.jsonResponses.filter(r => r.hasPrice).length} com dados de veículos`);
  } catch (err) {
    report.errors.push(String(err).slice(0, 200));
  } finally {
    await context.close();
  }

  return report;
}

async function main() {
  const target = process.argv[2]?.toUpperCase();
  const sitesToRun = target
    ? SITES.filter(s => s.name === target)
    : SITES;

  if (sitesToRun.length === 0) {
    console.error(`Site "${target}" não encontrado. Opções: ${SITES.map(s => s.name).join(', ')}`);
    process.exit(1);
  }

  const allReports: SiteReport[] = [];

  for (const site of sitesToRun) {
    const report = await discoverSite(site);
    allReports.push(report);
  }

  await closeBrowser();

  const outputPath = `${__dirname}/../discover-output.json`;
  fs.writeFileSync(outputPath, JSON.stringify(allReports, null, 2));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[DISCOVER] Resultado salvo em: ${outputPath}`);

  // Resumo
  console.log('\n📊 RESUMO:');
  for (const r of allReports) {
    const vehicleResponses = r.jsonResponses.filter(x => x.hasPrice);
    console.log(`  ${r.site}: ${r.jsonResponses.length} JSON, ${vehicleResponses.length} com veículos${r.errors.length ? `, ${r.errors.length} erros` : ''}`);
    if (vehicleResponses.length > 0) {
      console.log(`    URLs com veículos:`);
      vehicleResponses.forEach(v => console.log(`      → ${v.url.slice(0, 120)}`));
    }
  }
}

main().catch(console.error);
