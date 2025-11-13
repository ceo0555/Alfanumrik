import { Router } from 'express';
import { z } from 'zod';
import { db } from '../services/db';
import { createAuthToken, hashPassword, verifyPassword } from '../services/auth';
import type { User } from '../types';
import { validateBody } from '../utils/validation';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().default('teacher'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof registerSchema>;
  const existing = await db.query<User>('SELECT id FROM users WHERE email = $1', [payload.email]);
  if (existing.length) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const passwordHash = await hashPassword(payload.password);
  const result = await db.query<User>(
    `
    INSERT INTO users (email, password_hash, role)
    VALUES ($1, $2, $3)
    RETURNING id, email, role, password_hash AS "passwordHash", created_at AS "createdAt"
    `,
    [payload.email, passwordHash, payload.role]
  );

  const user = result[0];
  const token = createAuthToken({ sub: user.id, role: user.role });
  res.status(201).json({ data: { user: { id: user.id, email: user.email, role: user.role }, token } });
});

authRouter.post('/login', validateBody(loginSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof loginSchema>;
  const result = await db.query<User>(
    `
    SELECT id, email, role, password_hash AS "passwordHash", created_at AS "createdAt"
    FROM users
    WHERE email = $1
    `,
    [payload.email]
  );

  const user = result[0];
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await verifyPassword(payload.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = createAuthToken({ sub: user.id, role: user.role });
  res.json({ data: { user: { id: user.id, email: user.email, role: user.role }, token } });
});
