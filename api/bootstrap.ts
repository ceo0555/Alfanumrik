import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllResources } from './resourceStore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await getAllResources();
    return res.status(200).json({ data });
  } catch (error) {
    console.error('Failed to fetch bootstrap data', error);
    return res.status(500).json({ error: 'Failed to load bootstrap data.' });
  }
}
