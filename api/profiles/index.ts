import type { VercelRequest, VercelResponse } from '@vercel/node';
import { backendFetch } from '../_backendClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const result = await backendFetch<{ data: unknown }>('/api/profiles', { method: 'GET' });
      return res.status(result.status).json(result.data);
    }

    if (req.method === 'POST') {
      const body =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
      const result = await backendFetch<{ data: unknown }>('/api/profiles', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      });
      return res.status(result.status).json(result.data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('profiles/index handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
