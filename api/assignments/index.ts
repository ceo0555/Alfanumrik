import type { VercelRequest, VercelResponse } from '@vercel/node';
import { backendFetch } from '../_backendClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization;
    if (req.method === 'GET') {
      const result = await backendFetch<{ data: unknown }>('/api/assignments', {
        method: 'GET',
        headers: authHeader ? { Authorization: authHeader } : undefined,
      });
      if (result.status === 204) {
        return res.status(204).end();
      }
      return res.status(result.status).json(result.data);
    }

    if (req.method === 'POST') {
      const body =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
      const result = await backendFetch<{ data: unknown }>('/api/assignments', {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      });
      if (result.status === 204) {
        return res.status(204).end();
      }
      return res.status(result.status).json(result.data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('assignments/index handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
