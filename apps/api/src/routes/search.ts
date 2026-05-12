import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { runAllScrapers } from '../../../../packages/scrapers/src/index';

const router = Router();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

router.get('/', async (req: Request, res: Response) => {
  const { location, startDate, endDate, category, provider, maxPrice } = req.query;

  const hasSearchParams = !!(location && startDate && endDate);
  let usedScrapers = false;

  if (hasSearchParams) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      // Checa cache
      const cached = await prisma.searchCache.findFirst({
        where: { location: location as string, startDate: start, endDate: end },
      });

      const cacheValid = cached && (Date.now() - cached.updatedAt.getTime()) < CACHE_TTL_MS;

      if (!cacheValid) {
        // Roda scrapers e persiste os resultados
        try {
          const scraped = await runAllScrapers({
            location: location as string,
            startDate: startDate as string,
            endDate: endDate as string,
          });

          if (scraped.length > 0) {
            // Limpa ofertas antigas e insere as novas
            await prisma.carOffer.deleteMany({});
            await prisma.carOffer.createMany({
              data: scraped.map(o => ({
                provider: o.provider as any,
                model: o.model,
                category: o.category as any,
                price: o.price,
                transmission: o.transmission,
                hasAC: o.hasAC,
                seats: o.seats,
                deepLink: o.deepLink,
                imageUrl: o.imageUrl ?? null,
              })),
              skipDuplicates: true,
            });
            usedScrapers = true;
          }
        } catch (err) {
          console.error('[search] Scrapers falharam:', err);
        }

        // Salva cache
        const freshOffers = await prisma.carOffer.findMany({ orderBy: { price: 'asc' } });
        await prisma.searchCache.upsert({
          where: { id: `${location}-${startDate}-${endDate}` },
          create: {
            id: `${location}-${startDate}-${endDate}`,
            location: location as string,
            startDate: start,
            endDate: end,
            results: freshOffers as any,
          },
          update: { results: freshOffers as any },
        });
      }
    }
  }

  // Filtros aplicados após scraping
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (provider) where.provider = provider;
  if (maxPrice) where.price = { lte: parseFloat(maxPrice as string) };

  const offers = await prisma.carOffer.findMany({
    where,
    orderBy: { price: 'asc' },
  });

  res.json({ results: offers, cached: !usedScrapers && !hasSearchParams });
});

export default router;
