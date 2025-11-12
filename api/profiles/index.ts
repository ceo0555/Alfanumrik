import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getResource, setResource } from '../resourceStore';
import { parseJsonBody, generateNumericId } from '../_utils';
import type { UserProfile } from '../../types';

const RESOURCE_KEY = 'userProfiles';

const readProfiles = async (): Promise<UserProfile[]> => {
  const profiles = await getResource<UserProfile[]>(RESOURCE_KEY);
  return Array.isArray(profiles) ? profiles : [];
};

const writeProfiles = (profiles: UserProfile[]) => setResource<UserProfile[]>(RESOURCE_KEY, profiles);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const profiles = await readProfiles();
      return res.status(200).json({ data: profiles });
    }

    if (req.method === 'POST') {
      const body = parseJsonBody<{ profile?: Partial<UserProfile> }>(req);
      const incoming = body.profile;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'Invalid payload. Expecting { profile: {...} }' });
      }

      const profiles = await readProfiles();
      const id = typeof incoming.id === 'number' ? incoming.id : generateNumericId();
      const profile: UserProfile = {
        studyPlan: [],
        widgets: [],
        achievements: [],
        unlockedPetAccessories: [],
        dailyChallenge: null,
        tutorSessionUnlocked: false,
        scholarCoins: 0,
        xp: 0,
        level: 1,
        currentStreak: 0,
        lastStreakDate: '',
        ...incoming,
        id,
      } as UserProfile;

      profiles.push(profile);
      await writeProfiles(profiles);
      return res.status(201).json({ data: profile });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('profiles/index handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
