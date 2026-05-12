import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import searchRoutes from './routes/search';
import bookmarkRoutes from './routes/bookmarks';
import alertRoutes from './routes/alerts';

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/status', (_req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString(), version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/alerts', alertRoutes);

app.listen(port, () => {
  console.log(`🚀 LocFly API rodando em http://localhost:${port}`);
});

export default app;
