import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import { logger } from './logger';
import authRoutes from './routes/auth';
import searchRoutes from './routes/search';
import bookmarkRoutes from './routes/bookmarks';
import alertRoutes from './routes/alerts';
import catalogRoutes from './routes/catalog';

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// HTTP request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({ method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - start });
  });
  next();
});

app.get('/status', (_req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString(), version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/catalog', catalogRoutes);

app.listen(port, () => {
  logger.info(`LocFly API rodando em http://localhost:${port}`);

  // Inicializa filas BullMQ (não bloqueia server startup)
  Promise.all([
    import('./queue/alertQueue'),
    import('./queue/emailQueue'),
  ]).then(async ([{ alertQueue }]) => {
    try {
      await alertQueue.add('check-alerts', {}, {
        repeat: { pattern: '*/30 * * * *' },
      });
      logger.info('BullMQ: job de alertas agendado (a cada 30 min)');
    } catch (err) {
      logger.warn({ err }, 'BullMQ: falha ao agendar job — Redis disponível?');
    }
  }).catch((err: Error) => {
    logger.warn({ err }, 'BullMQ: falha ao importar queues');
  });
});

export default app;
