import { Queue, Worker } from 'bullmq'
import { redisConnection } from './connection'
import { checkAlerts } from './jobs/checkAlerts'
import { logger } from '../logger'

export const alertQueue = new Queue('price-alerts', { connection: redisConnection })

export const alertWorker = new Worker('price-alerts', checkAlerts, {
  connection: redisConnection,
})

alertWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, '[alertWorker] job falhou')
})
