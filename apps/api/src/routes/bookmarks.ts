import { Router, Response } from 'express';
import { prisma } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: req.userId! },
    include: { carOffer: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(bookmarks.map((b) => b.carOffer));
});

router.post('/:carOfferId', async (req: AuthRequest, res: Response) => {
  const carOfferId = req.params['carOfferId'] as string;
  try {
    const bookmark = await prisma.bookmark.create({
      data: { userId: req.userId!, carOfferId },
    });
    res.status(201).json(bookmark);
  } catch {
    res.status(409).json({ error: 'Já favoritado' });
  }
});

router.delete('/:carOfferId', async (req: AuthRequest, res: Response) => {
  const carOfferId = req.params['carOfferId'] as string;
  await prisma.bookmark.deleteMany({
    where: { userId: req.userId!, carOfferId },
  });
  res.status(204).send();
});

export default router;
