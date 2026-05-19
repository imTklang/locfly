import type { Job } from 'bullmq'
import { prisma } from '../../db'
import { redisConnection } from '../connection'
import { emailQueue } from '../emailQueue'
import { logger } from '../../logger'
import { runAllScrapers } from '../../../../../packages/scrapers/src/index'

const CHECK_DATE_RANGE_DAYS = 7

function dateString(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10)
}

export async function checkAlerts(_job: Job): Promise<void> {
  logger.info('[checkAlerts] iniciando verificação de alertas')

  const alerts = await prisma.priceAlert.findMany({
    where: { isActive: true },
    include: { user: { select: { email: true, name: true } } },
  })

  if (alerts.length === 0) {
    logger.info('[checkAlerts] nenhum alerta ativo')
    return
  }

  logger.info({ count: alerts.length }, '[checkAlerts] alertas ativos encontrados')

  // Agrupa por localização para não rodar scrapers duplicados
  const byLocation = new Map<string, typeof alerts>()
  for (const alert of alerts) {
    if (!byLocation.has(alert.location)) byLocation.set(alert.location, [])
    byLocation.get(alert.location)!.push(alert)
  }

  const startDate = dateString(0)
  const endDate = dateString(CHECK_DATE_RANGE_DAYS)

  for (const [location, locationAlerts] of byLocation) {
    const cacheKey = `search:${location}:${startDate}:${endDate}`
    let offers: Array<Record<string, unknown>> = []

    try {
      const cached = await redisConnection.get(cacheKey)
      if (cached) {
        offers = JSON.parse(cached) as Array<Record<string, unknown>>
        logger.info({ location }, '[checkAlerts] preços carregados do cache Redis')
      } else {
        logger.info({ location }, '[checkAlerts] cache vazio — rodando scrapers')
        const scraped = await runAllScrapers({ location, startDate, endDate })
        offers = scraped as unknown as Array<Record<string, unknown>>
        if (offers.length > 0) {
          await redisConnection.set(cacheKey, JSON.stringify(offers), 'EX', 600)
        }
      }
    } catch (err) {
      logger.error({ err, location }, '[checkAlerts] erro ao buscar preços para localização')
      continue
    }

    for (const alert of locationAlerts) {
      const idempotencyKey = `alert:sent:${alert.id}`
      const alreadySent = await redisConnection.exists(idempotencyKey)
      if (alreadySent) {
        logger.info({ alertId: alert.id }, '[checkAlerts] alerta já notificado nas últimas 24h')
        continue
      }

      const matching = offers.filter((o) => {
        if (Number(o['price']) > Number(alert.targetPrice)) return false
        if (alert.carCategory && o['category'] !== alert.carCategory) return false
        return true
      })

      if (matching.length > 0) {
        await emailQueue.add('send-price-alert', {
          to: alert.user.email,
          userName: alert.user.name,
          location: alert.location,
          targetPrice: Number(alert.targetPrice),
          offers: matching.slice(0, 3).map((o) => ({
            provider: String(o['provider']),
            model: String(o['model']),
            price: Number(o['price']),
            deepLink: String(o['deepLink']),
          })),
        })

        // Marca como notificado por 24h
        await redisConnection.set(idempotencyKey, '1', 'EX', 86400)
        logger.info(
          { alertId: alert.id, matches: matching.length, to: alert.user.email },
          '[checkAlerts] e-mail de alerta enfileirado',
        )
      } else {
        logger.info(
          { alertId: alert.id, targetPrice: alert.targetPrice },
          '[checkAlerts] nenhuma oferta abaixo do preço alvo',
        )
      }
    }
  }

  logger.info('[checkAlerts] verificação concluída')
}
