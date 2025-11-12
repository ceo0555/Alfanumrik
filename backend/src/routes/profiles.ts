import { Router } from 'express';
import { z } from 'zod';
import { db } from '../services/db';
import type { UserProfile } from '../types';
import { validateBody } from '../utils/validation';

const profileSchema = z.object({
  name: z.string(),
  grade: z.string(),
  lastSubject: z.string().optional(),
  lastChapter: z.string().optional(),
  userRole: z.string().optional(),
});

export const profilesRouter = Router();

profilesRouter.get('/', async (_req, res) => {
  const result = await db.query<UserProfile>('SELECT * FROM user_profiles ORDER BY id ASC');
  res.json({ data: result });
});

profilesRouter.post(
  '/',
  validateBody(profileSchema),
  async (req, res) => {
    const payload = req.body as z.infer<typeof profileSchema>;
    const result = await db.query<UserProfile>(
      `
      INSERT INTO user_profiles (name, grade, last_subject, last_chapter, user_role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [payload.name, payload.grade, payload.lastSubject ?? null, payload.lastChapter ?? null, payload.userRole ?? null]
    );
    res.status(201).json({ data: result[0] });
  }
);
