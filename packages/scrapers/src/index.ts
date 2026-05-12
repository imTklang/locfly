import { ScraperParams, ScrapedOffer, ScraperResult } from './types';
import { scrapeLocaliza } from './scrapers/localiza';
import { scrapeMovida } from './scrapers/movida';
import { scrapeUnidas } from './scrapers/unidas';
import { scrapeHertz } from './scrapers/hertz';
import { scrapeFoco } from './scrapers/foco';
import { closeBrowser } from './browser';

const SCRAPERS: Array<{ name: ScrapedOffer['provider']; fn: (p: ScraperParams) => Promise<ScrapedOffer[]> }> = [
  { name: 'LOCALIZA', fn: scrapeLocaliza },
  { name: 'MOVIDA', fn: scrapeMovida },
  { name: 'UNIDAS', fn: scrapeUnidas },
  { name: 'HERTZ', fn: scrapeHertz },
  { name: 'FOCO', fn: scrapeFoco },
];

export async function runAllScrapers(params: ScraperParams): Promise<ScrapedOffer[]> {
  console.log(`[scrapers] Buscando: ${params.location} | ${params.startDate} → ${params.endDate}`);

  const results = await Promise.allSettled(
    SCRAPERS.map(async ({ name, fn }): Promise<ScraperResult> => {
      const t0 = Date.now();
      try {
        const offers = await fn(params);
        console.log(`[${name}] ✓ ${offers.length} ofertas (${Date.now() - t0}ms)`);
        return { provider: name, offers, durationMs: Date.now() - t0 };
      } catch (err) {
        console.error(`[${name}] ✗ ${err instanceof Error ? err.message : err}`);
        return { provider: name, offers: [], error: String(err), durationMs: Date.now() - t0 };
      }
    })
  );

  const allOffers: ScrapedOffer[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allOffers.push(...result.value.offers);
    }
  }

  console.log(`[scrapers] Total: ${allOffers.length} ofertas de ${results.length} locadoras`);
  return allOffers;
}

// Teste standalone
if (require.main === module) {
  runAllScrapers({ location: 'São Paulo', startDate: '2026-06-01', endDate: '2026-06-05' })
    .then(async offers => {
      await closeBrowser();
      console.log(`\n=== RESULTADO ===`);
      console.log(`Total: ${offers.length} ofertas`);
      const byProvider = offers.reduce((acc, o) => {
        acc[o.provider] = (acc[o.provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('Por locadora:', byProvider);
      console.log('Mais baratos:');
      offers.sort((a, b) => a.price - b.price).slice(0, 5).forEach(o =>
        console.log(`  ${o.provider} - ${o.model}: R$ ${o.price}/dia`)
      );
    })
    .catch(async (err) => { await closeBrowser(); console.error(err); });
}
