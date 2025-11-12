import { Router } from 'express';
import { z } from 'zod';
import { db } from '../services/db';
import type { Assignment } from '../types';
import { validateBody } from '../utils/validation';
import { requireAuth } from '../middleware/requireAuth';

const upsertAssignmentSchema = z.object({
  title: z.string().min(1),
  instructions: z.string().min(1),
  dueDate: z.string().datetime().optional().nullable(),
  grade: z.string().optional().nullable(),
});

export const assignmentsRouter = Router();

assignmentsRouter.get('/', async (_req, res) => {
  const data = await db.query<Assignment>(
    'SELECT id, title, instructions, due_date as "dueDate", grade, created_at as "createdAt" FROM assignments ORDER BY created_at DESC'
  );
  res.json({ data });
});

assignmentsRouter.post('/', requireAuth(['teacher', 'admin']), validateBody(upsertAssignmentSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof upsertAssignmentSchema>;
  const result = await db.query<Assignment>(
    `
    INSERT INTO assignments (title, instructions, due_date, grade)
    VALUES ($1, $2, $3, $4)
    RETURNING id, title, instructions, due_date as "dueDate", grade, created_at as "createdAt"
    `,
    [payload.title, payload.instructions, payload.dueDate ?? null, payload.grade ?? null]
  );
  res.status(201).json({ data: result[0] });
});

assignmentsRouter.put(
  '/:id',
  requireAuth(['teacher', 'admin']),
  validateBody(upsertAssignmentSchema),
  async (req, res) => {
    const payload = req.body as z.infer<typeof upsertAssignmentSchema>;
    const { id } = req.params;
    const result = await db.query<Assignment>(
      `
      UPDATE assignments
      SET title = $1,
          instructions = $2,
          due_date = $3,
          grade = $4
      WHERE id = $5
      RETURNING id, title, instructions, due_date as "dueDate", grade, created_at as "createdAt"
      `,
      [payload.title, payload.instructions, payload.dueDate ?? null, payload.grade ?? null, id]
    );
    if (!result.length) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ data: result[0] });
  }
);

assignmentsRouter.delete('/:id', requireAuth(['teacher', 'admin']), async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM assignments WHERE id = $1', [id]);
  res.status(204).send();
});
