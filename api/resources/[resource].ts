import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deleteResource, getResource, setResource } from '../resourceStore';

const RESOURCE_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

const parseBody = (req: VercelRequest): { data: unknown } => {
  if (typeof req.body === 'string' && req.body.length > 0) {
    return JSON.parse(req.body);
  }
  if (req.body && typeof req.body === 'object') {
    return req.body as { data: unknown };
  }
  return { data: null };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.resource;
  const resource =
    typeof slug === 'string' ? slug : Array.isArray(slug) ? slug[0] : undefined;

  if (!resource || !RESOURCE_NAME_REGEX.test(resource)) {
    return res.status(400).json({ error: 'Invalid resource name.' });
  }

  if (req.method === 'GET') {
    try {
      const data = await getResource(resource);
      return res.status(200).json({ data: data ?? null });
    } catch (error) {
      console.error(`Failed to read resource ${resource}`, error);
      return res.status(500).json({ error: 'Failed to load resource.' });
    }
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    try {
      const { data } = parseBody(req);
      await setResource(resource, data ?? null);
      return res.status(204).end();
    } catch (error) {
      console.error(`Failed to save resource ${resource}`, error);
      return res.status(500).json({ error: 'Failed to persist resource.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await deleteResource(resource);
      return res.status(204).end();
    } catch (error) {
      console.error(`Failed to delete resource ${resource}`, error);
      return res.status(500).json({ error: 'Failed to delete resource.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
