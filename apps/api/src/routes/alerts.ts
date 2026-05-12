import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const alertSchema = z.object({
  location: z.string().min(2),
  targetPrice: z.number().positive(),
  carCategory: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const alerts = await prisma.priceAlert.findMany({
    where: { userId: req.userId!, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(alerts);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parse = alertSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0]?.message });
    return;
  }
  const alert = await prisma.priceAlert.create({
    data: { ...parse.data, userId: req.userId! },
  });
  res.status(201).json(alert);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.priceAlert.updateMany({
    where: { id: req.params['id'] as string, userId: req.userId! },
    data: { isActive: false },
  });
  res.status(204).send();
});

export default router;
