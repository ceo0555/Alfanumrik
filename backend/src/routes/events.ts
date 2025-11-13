import { Router } from 'express';
import { z } from 'zod';
import { db } from '../services/db';
import { validateBody } from '../utils/validation';
import type { InteractionEvent, NewInteractionEvent } from '../types';

const eventSchema = z.object({
  userId: z.string().uuid().optional(),
  profileId: z.number().int().optional(),
  sessionId: z.string().optional(),
  eventType: z.string().min(1),
  contentId: z.string().optional(),
  skillIds: z.array(z.string()).optional(),
  success: z.boolean().optional(),
  score: z.number().optional(),
  durationMs: z.number().int().optional(),
  payload: z.record(z.any()).optional(),
  occurredAt: z.string().datetime().optional(),
});

const mapEvent = (row: any): InteractionEvent => ({
  id: row.id,
  userId: row.user_id ?? undefined,
  profileId: row.profile_id ?? undefined,
  sessionId: row.session_id ?? undefined,
  eventType: row.event_type,
  contentId: row.content_id ?? undefined,
  skillIds: row.skill_ids ?? undefined,
  success: row.success ?? undefined,
  score: row.score !== null ? Number(row.score) : undefined,
  durationMs: row.duration_ms ?? undefined,
  payload: row.payload ?? undefined,
  occurredAt: row.occurred_at,
  createdAt: row.created_at,
});

export const eventsRouter = Router();

eventsRouter.get('/', async (req, res) => {
  const { userId, profileId, eventType, limit = '100' } = req.query;
  const params: unknown[] = [];
  const where: string[] = [];

  if (userId) {
    where.push(`user_id = $${where.length + 1}`);
    params.push(userId);
  }

  if (profileId) {
    where.push(`profile_id = $${where.length + 1}`);
    params.push(Number(profileId));
  }

  if (eventType) {
    where.push(`event_type = $${where.length + 1}`);
    params.push(eventType);
  }

  const limitValue = Math.min(Number(limit) || 100, 500);
  const query = `
    SELECT id, user_id, profile_id, session_id, event_type, content_id, skill_ids,
           success, score, duration_ms, payload, occurred_at, created_at
    FROM interaction_events
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY occurred_at DESC
    LIMIT ${limitValue}
  `;

  const result = await db.query(query, params);
  res.json({ data: result.map(mapEvent) });
});

eventsRouter.post('/', validateBody(z.object({ event: eventSchema })), async (req, res) => {
  const { event } = req.body as { event: NewInteractionEvent };
  const result = await db.query(
    `
      INSERT INTO interaction_events (
        user_id,
        profile_id,
        session_id,
        event_type,
        content_id,
        skill_ids,
        success,
        score,
        duration_ms,
        payload,
        occurred_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, COALESCE($11::timestamptz, now()))
      RETURNING id, user_id, profile_id, session_id, event_type, content_id, skill_ids,
                success, score, duration_ms, payload, occurred_at, created_at
    `,
    [
      event.userId ?? null,
      event.profileId ?? null,
      event.sessionId ?? null,
      event.eventType,
      event.contentId ?? null,
      event.skillIds ?? null,
      event.success ?? null,
      event.score ?? null,
      event.durationMs ?? null,
      event.payload ? JSON.stringify(event.payload) : null,
      event.occurredAt ?? null,
    ]
  );

  res.status(201).json({ data: mapEvent(result[0]) });
});
