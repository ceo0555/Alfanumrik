import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, execute } from './db';

const TABLE_NAME = 'app_state_store';
const STATE_KEY = 'app_state';

interface AppStateRow {
  value: Record<string, string>;
}

async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureTable();

    if (req.method === 'GET') {
      const rows = await query<AppStateRow>(`SELECT value FROM ${TABLE_NAME} WHERE key = $1`, [STATE_KEY]);
      if (!rows.length) {
        return res.status(404).json({ state: null });
      }
      return res.status(200).json({ state: rows[0].value });
    }

    if (req.method === 'PUT') {
      const parsedBody =
        typeof req.body === 'string' && req.body.length > 0
          ? (JSON.parse(req.body) as { state?: Record<string, unknown> })
          : ((req.body ?? {}) as { state?: Record<string, unknown> });
      const { state } = parsedBody;
      if (!state || typeof state !== 'object') {
        return res.status(400).json({ error: 'Invalid payload: expected { state: Record<string,string> }' });
      }

      await execute(
        `
        INSERT INTO ${TABLE_NAME} (key, value, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `,
        [STATE_KEY, state]
      );

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('app-state handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
