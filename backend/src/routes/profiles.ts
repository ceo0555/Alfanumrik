import { Router } from 'express';
import { z } from 'zod';
import { db } from '../services/db';
import type { UserProfile } from '../types';
import { validateBody } from '../utils/validation';
import { requireAuth } from '../middleware/requireAuth';

const profileSchema = z.object({
  name: z.string(),
  grade: z.string(),
  lastSubject: z.string().optional(),
  lastChapter: z.string().optional(),
  userRole: z.string().optional(),
});

export const profilesRouter = Router();

const mapProfile = (row: any): UserProfile => ({
  id: row.id,
  name: row.name,
  grade: row.grade,
  lastSubject: row.last_subject,
  lastChapter: row.last_chapter,
  userRole: row.user_role,
});

profilesRouter.get('/', async (_req, res) => {
  const result = await db.query(
    'SELECT id, name, grade, last_subject, last_chapter, user_role FROM user_profiles ORDER BY id ASC'
  );
  res.json({ data: result.map(mapProfile) });
});

profilesRouter.get('/:id', async (req, res) => {
  const result = await db.query(
    'SELECT id, name, grade, last_subject, last_chapter, user_role FROM user_profiles WHERE id = $1',
    [req.params.id]
  );
  if (!result.length) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json({ data: mapProfile(result[0]) });
});

profilesRouter.post('/', requireAuth(['admin']), validateBody(profileSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof profileSchema>;
  const result = await db.query(
    `
    INSERT INTO user_profiles (name, grade, last_subject, last_chapter, user_role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, grade, last_subject, last_chapter, user_role
    `,
    [payload.name, payload.grade, payload.lastSubject ?? null, payload.lastChapter ?? null, payload.userRole ?? null]
  );
  res.status(201).json({ data: mapProfile(result[0]) });
});

profilesRouter.put('/:id', requireAuth(['admin']), validateBody(profileSchema.partial()), async (req, res) => {
  const payload = req.body as Partial<z.infer<typeof profileSchema>>;
  const result = await db.query(
    `
    UPDATE user_profiles
    SET name = COALESCE($1, name),
        grade = COALESCE($2, grade),
        last_subject = COALESCE($3, last_subject),
        last_chapter = COALESCE($4, last_chapter),
        user_role = COALESCE($5, user_role)
    WHERE id = $6
    RETURNING id, name, grade, last_subject, last_chapter, user_role
    `,
    [
      payload.name ?? null,
      payload.grade ?? null,
      payload.lastSubject ?? null,
      payload.lastChapter ?? null,
      payload.userRole ?? null,
      req.params.id,
    ]
  );
  if (!result.length) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json({ data: mapProfile(result[0]) });
});

profilesRouter.delete('/:id', requireAuth(['admin']), async (req, res) => {
  await db.query('DELETE FROM user_profiles WHERE id = $1', [req.params.id]);
  res.status(204).end();
});
