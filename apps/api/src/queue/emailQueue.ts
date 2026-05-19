import { Queue, Worker, type Job } from 'bullmq'
import { redisConnection } from './connection'
import { logger } from '../logger'

interface PriceAlertEmailJob {
  to: string
  userName: string | null
  location: string
  targetPrice: number
  offers: Array<{ provider: string; model: string; price: number; deepLink: string }>
}

async function sendPriceAlertEmail(job: Job<PriceAlertEmailJob>): Promise<void> {
  const { to, userName, location, targetPrice, offers } = job.data
  // TODO: integrar serviço de e-mail (Resend / Nodemailer)
  logger.info(
    { to, location, targetPrice, offerCount: offers.length, userName },
    '[email] alerta de preço — e-mail seria enviado aqui',
  )
}

export const emailQueue = new Queue<PriceAlertEmailJob>('email-dispatch', {
  connection: redisConnection,
})

export const emailWorker = new Worker<PriceAlertEmailJob>(
  'email-dispatch',
  sendPriceAlertEmail,
  { connection: redisConnection },
)

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, '[emailWorker] job falhou')
})
