import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getResource, setResource } from '../resourceStore';
import { parseJsonBody } from '../_utils';
import type { StudyTask, UserProfile } from '../../types';

const RESOURCE_KEY = 'userProfiles';

const readProfiles = async (): Promise<UserProfile[]> => {
  const profiles = await getResource<UserProfile[]>(RESOURCE_KEY);
  return Array.isArray(profiles) ? profiles : [];
};

const writeProfiles = (profiles: UserProfile[]) => setResource<UserProfile[]>(RESOURCE_KEY, profiles);

const resolveUserId = (value: string | string[] | undefined): number | null => {
  const slug = Array.isArray(value) ? value[0] : value;
  if (!slug) return null;
  const id = Number(slug);
  return Number.isNaN(id) ? null : id;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = resolveUserId(req.query.userId);
    if (userId === null) {
      return res.status(400).json({ error: 'Invalid user id.' });
    }

    const profiles = await readProfiles();
    const index = profiles.findIndex((profile) => profile.id === userId);

    if (index === -1) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    if (req.method === 'GET') {
      const studyPlan = profiles[index].studyPlan ?? [];
      return res.status(200).json({ data: studyPlan });
    }

    if (req.method === 'PUT') {
      const body = parseJsonBody<{ studyPlan?: StudyTask[] }>(req);
      if (!Array.isArray(body.studyPlan)) {
        return res.status(400).json({ error: 'Invalid payload. Expecting { studyPlan: [...] }' });
      }
      profiles[index] = { ...profiles[index], studyPlan: body.studyPlan };
      await writeProfiles(profiles);
      return res.status(200).json({ data: profiles[index].studyPlan });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('study-plans/[userId] handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
