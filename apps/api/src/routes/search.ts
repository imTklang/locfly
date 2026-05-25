import { Router, type Request, type Response } from 'express';
import { prisma } from '../db';
import { logger } from '../logger';
import { redisConnection } from '../queue/connection';
import { runAllScrapers } from '../../../../packages/scrapers/src/index';
import type { ScrapedOffer } from '../../../../packages/scrapers/src/types';

const router = Router();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const REDIS_TTL_S = 600; // 10 min

router.get('/', async (req: Request, res: Response) => {
  const { location, startDate, endDate, category, provider, maxPrice } = req.query;

  const hasSearchParams = !!(location && startDate && endDate);

  if (hasSearchParams) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const cacheKey = `search:${location as string}:${startDate as string}:${endDate as string}`;

      // 1. Redis cache
      try {
        const redisHit = await redisConnection.get(cacheKey);
        if (redisHit) {
          logger.info({ cacheKey }, 'cache hit (Redis)');
          const allOffers = JSON.parse(redisHit) as Record<string, unknown>[];
          return res.json({ results: applyFilters(allOffers, { category, provider, maxPrice }), cached: true });
        }
      } catch (redisErr) {
        logger.warn({ err: redisErr }, 'Redis indisponível, prosseguindo sem cache');
      }

      // 2. SearchCache (Prisma)
      const cached = await prisma.searchCache.findFirst({
        where: { location: location as string, startDate: start, endDate: end },
      });
      const cacheValid = cached && (Date.now() - cached.updatedAt.getTime()) < CACHE_TTL_MS;

      if (cacheValid && cached) {
        const allOffers = (cached.results as Record<string, unknown>[]) ?? [];
        try {
          await redisConnection.set(cacheKey, JSON.stringify(allOffers), 'EX', REDIS_TTL_S);
        } catch { /* Redis opcional */ }
        return res.json({ results: applyFilters(allOffers, { category, provider, maxPrice }), cached: true });
      }

      // 3. Scrapers — nunca toca em carOffer (seria sobrescrever o catálogo)
      let scraped: ScrapedOffer[] = [];
      try {
        scraped = await runAllScrapers({
          location: location as string,
          startDate: startDate as string,
          endDate: endDate as string,
        });
      } catch (err) {
        logger.error({ err }, '[search] scrapers falharam');
      }

      // 4. Persistir apenas no SearchCache + Redis
      await prisma.searchCache.upsert({
        where: { id: `${location}-${startDate}-${endDate}` },
        create: {
          id: `${location}-${startDate}-${endDate}`,
          location: location as string,
          startDate: start,
          endDate: end,
          results: scraped as never,
        },
        update: { results: scraped as never },
      });

      try {
        await redisConnection.set(cacheKey, JSON.stringify(scraped), 'EX', REDIS_TTL_S);
        logger.info({ cacheKey }, 'cache salvo (Redis)');
      } catch (redisErr) {
        logger.warn({ err: redisErr }, 'Redis: falha ao salvar cache');
      }

      logger.info(`[search] ${scraped.length} ofertas para ${location as string}`);
      return res.json({ results: applyFilters(scraped, { category, provider, maxPrice }), cached: false });
    }
  }

  // Sem parâmetros de busca — retorna catálogo (carOffer) com filtros opcionais
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (provider) where.provider = provider;
  if (maxPrice) where.price = { lte: parseFloat(maxPrice as string) };

  const offers = await prisma.carOffer.findMany({ where, orderBy: { price: 'asc' } });
  return res.json({ results: offers, cached: true });
});

function applyFilters(
  offers: Array<ScrapedOffer | Record<string, unknown>>,
  filters: { category?: unknown; provider?: unknown; maxPrice?: unknown },
) {
  return offers.filter(o => {
    if (filters.category && (o as Record<string, unknown>)['category'] !== filters.category) return false;
    if (filters.provider && (o as Record<string, unknown>)['provider'] !== filters.provider) return false;
    if (filters.maxPrice && Number((o as Record<string, unknown>)['price']) > parseFloat(filters.maxPrice as string)) return false;
    return true;
  });
}

export default router;
