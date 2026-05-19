import IORedis from 'ioredis'

export const redisConnection = new IORedis(
  process.env.REDIS_URL || 'redis://localhost:6379',
  { maxRetriesPerRequest: null },
)

redisConnection.on('error', (err: Error) => {
  if (err.message.includes('ECONNREFUSED')) {
    // logger não importado aqui para evitar circular dep — log direto é aceitável
    console.error('[redis] Conexão recusada — Redis não está rodando?')
  }
})
