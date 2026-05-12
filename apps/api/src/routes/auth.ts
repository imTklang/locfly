import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

router.post('/register', async (req: Request, res: Response) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0]?.message });
    return;
  }
  const { name, email, password } = parse.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    res.status(409).json({ error: 'E-mail já cadastrado' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });
  res.status(201).json({ token: signToken(user.id), user: { id: user.id, name: user.name, email: user.email } });
});

router.post('/login', async (req: Request, res: Response) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0]?.message });
    return;
  }
  const { email, password } = parse.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }
  res.json({ token: signToken(user.id), user: { id: user.id, name: user.name, email: user.email } });
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  res.json(user);
});

export default router;
