import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getResource, setResource } from '../resourceStore';
import { parseJsonBody } from '../_utils';
import type { UserProfile } from '../../types';

const RESOURCE_KEY = 'userProfiles';

const readProfiles = async (): Promise<UserProfile[]> => {
  const profiles = await getResource<UserProfile[]>(RESOURCE_KEY);
  return Array.isArray(profiles) ? profiles : [];
};

const writeProfiles = (profiles: UserProfile[]) => setResource<UserProfile[]>(RESOURCE_KEY, profiles);

const resolveId = (value: string | string[] | undefined): number | null => {
  const slug = Array.isArray(value) ? value[0] : value;
  if (!slug) return null;
  const id = Number(slug);
  return Number.isNaN(id) ? null : id;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = resolveId(req.query.id);
    if (id === null) {
      return res.status(400).json({ error: 'Invalid profile id.' });
    }

    const profiles = await readProfiles();
    const index = profiles.findIndex((profile) => profile.id === id);

    if (req.method === 'GET') {
      if (index === -1) {
        return res.status(404).json({ error: 'Profile not found.' });
      }
      return res.status(200).json({ data: profiles[index] });
    }

    if (req.method === 'PUT') {
      if (index === -1) {
        return res.status(404).json({ error: 'Profile not found.' });
      }
      const body = parseJsonBody<{ profile?: Partial<UserProfile> }>(req);
      const incoming = body.profile;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'Invalid payload. Expecting { profile: {...} }' });
      }
      const updated = { ...profiles[index], ...incoming, id };
      profiles[index] = updated;
      await writeProfiles(profiles);
      return res.status(200).json({ data: updated });
    }

    if (req.method === 'DELETE') {
      if (index === -1) {
        return res.status(404).json({ error: 'Profile not found.' });
      }
      profiles.splice(index, 1);
      await writeProfiles(profiles);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('profiles/[id] handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
