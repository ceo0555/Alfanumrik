import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getResource, setResource } from '../resourceStore';
import { parseJsonBody } from '../_utils';
import type { StudentSubmission } from '../../types';

const RESOURCE_KEY = 'allSubmissions';

const readSubmissions = async (): Promise<StudentSubmission[]> => {
  const submissions = await getResource<StudentSubmission[]>(RESOURCE_KEY);
  return Array.isArray(submissions) ? submissions : [];
};

const writeSubmissions = (submissions: StudentSubmission[]) =>
  setResource<StudentSubmission[]>(RESOURCE_KEY, submissions);

const resolveId = (value: string | string[] | undefined): string | null => {
  const slug = Array.isArray(value) ? value[0] : value;
  return slug ?? null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = resolveId(req.query.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid submission id.' });
    }

    const submissions = await readSubmissions();
    const index = submissions.findIndex((submission) => submission.id === id);

    if (req.method === 'GET') {
      if (index === -1) {
        return res.status(404).json({ error: 'Submission not found.' });
      }
      return res.status(200).json({ data: submissions[index] });
    }

    if (req.method === 'PUT') {
      if (index === -1) {
        return res.status(404).json({ error: 'Submission not found.' });
      }
      const body = parseJsonBody<{ submission?: Partial<StudentSubmission> }>(req);
      const incoming = body.submission;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'Invalid payload. Expecting { submission: {...} }' });
      }
      const updated = { ...submissions[index], ...incoming, id };
      submissions[index] = updated;
      await writeSubmissions(submissions);
      return res.status(200).json({ data: updated });
    }

    if (req.method === 'DELETE') {
      if (index === -1) {
        return res.status(404).json({ error: 'Submission not found.' });
      }
      submissions.splice(index, 1);
      await writeSubmissions(submissions);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('submissions/[id] handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
