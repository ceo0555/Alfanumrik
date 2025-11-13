import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getResource, setResource } from '../resourceStore';
import { parseJsonBody, generateStringId } from '../_utils';
import type { StudentSubmission } from '../../types';

const RESOURCE_KEY = 'allSubmissions';

const readSubmissions = async (): Promise<StudentSubmission[]> => {
  const submissions = await getResource<StudentSubmission[]>(RESOURCE_KEY);
  return Array.isArray(submissions) ? submissions : [];
};

const writeSubmissions = (submissions: StudentSubmission[]) =>
  setResource<StudentSubmission[]>(RESOURCE_KEY, submissions);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const submissions = await readSubmissions();
      return res.status(200).json({ data: submissions });
    }

    if (req.method === 'POST') {
      const body = parseJsonBody<{ submission?: Partial<StudentSubmission> }>(req);
      const incoming = body.submission;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'Invalid payload. Expecting { submission: {...} }' });
      }

      const submissions = await readSubmissions();
      const id = typeof incoming.id === 'string' ? incoming.id : generateStringId('submission');
      const submission: StudentSubmission = {
        status: 'pending',
        submittedAt: new Date().toISOString(),
        ...incoming,
        id,
      } as StudentSubmission;

      submissions.push(submission);
      await writeSubmissions(submissions);
      return res.status(201).json({ data: submission });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('submissions/index handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
