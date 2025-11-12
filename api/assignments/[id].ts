import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getResource, setResource } from '../resourceStore';
import { parseJsonBody } from '../_utils';
import type { Assignment } from '../../types';

const RESOURCE_KEY = 'allAssignments';

const readAssignments = async (): Promise<Assignment[]> => {
  const assignments = await getResource<Assignment[]>(RESOURCE_KEY);
  return Array.isArray(assignments) ? assignments : [];
};

const writeAssignments = (assignments: Assignment[]) =>
  setResource<Assignment[]>(RESOURCE_KEY, assignments);

const resolveId = (value: string | string[] | undefined): string | null => {
  const slug = Array.isArray(value) ? value[0] : value;
  return slug ?? null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = resolveId(req.query.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid assignment id.' });
    }

    const assignments = await readAssignments();
    const index = assignments.findIndex((assignment) => assignment.id === id);

    if (req.method === 'GET') {
      if (index === -1) {
        return res.status(404).json({ error: 'Assignment not found.' });
      }
      return res.status(200).json({ data: assignments[index] });
    }

    if (req.method === 'PUT') {
      if (index === -1) {
        return res.status(404).json({ error: 'Assignment not found.' });
      }
      const body = parseJsonBody<{ assignment?: Partial<Assignment> }>(req);
      const incoming = body.assignment;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'Invalid payload. Expecting { assignment: {...} }' });
      }
      const updated = { ...assignments[index], ...incoming, id };
      assignments[index] = updated;
      await writeAssignments(assignments);
      return res.status(200).json({ data: updated });
    }

    if (req.method === 'DELETE') {
      if (index === -1) {
        return res.status(404).json({ error: 'Assignment not found.' });
      }
      assignments.splice(index, 1);
      await writeAssignments(assignments);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('assignments/[id] handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
