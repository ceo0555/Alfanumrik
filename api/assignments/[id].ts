import type { VercelRequest, VercelResponse } from '@vercel/node';
import { backendFetch } from '../_backendClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!id) {
      return res.status(400).json({ error: 'Invalid assignment id.' });
    }
    const authHeader = req.headers.authorization;

    if (req.method === 'GET') {
      const result = await backendFetch<{ data: unknown }>(`/api/assignments/${id}`, {
        method: 'GET',
        headers: authHeader ? { Authorization: authHeader } : undefined,
      });
      if (result.status === 204) {
        return res.status(204).end();
      }
      return res.status(result.status).json(result.data);
    }

    if (req.method === 'PUT') {
      const body =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
      const result = await backendFetch<{ data: unknown }>(`/api/assignments/${id}`, {
        method: 'PUT',
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

    if (req.method === 'DELETE') {
      const result = await backendFetch<unknown>(`/api/assignments/${id}`, {
        method: 'DELETE',
        headers: authHeader ? { Authorization: authHeader } : undefined,
      });
      if (result.status === 204) {
        return res.status(204).end();
      }
      return res.status(result.status).json(result.data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('assignments/[id] handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
