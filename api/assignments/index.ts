import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getResource, setResource } from '../resourceStore';
import { parseJsonBody, generateStringId } from '../_utils';
import type { Assignment } from '../../types';

const RESOURCE_KEY = 'allAssignments';

const readAssignments = async (): Promise<Assignment[]> => {
  const assignments = await getResource<Assignment[]>(RESOURCE_KEY);
  return Array.isArray(assignments) ? assignments : [];
};

const writeAssignments = (assignments: Assignment[]) =>
  setResource<Assignment[]>(RESOURCE_KEY, assignments);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const assignments = await readAssignments();
      return res.status(200).json({ data: assignments });
    }

    if (req.method === 'POST') {
      const body = parseJsonBody<{ assignment?: Partial<Assignment> }>(req);
      const incoming = body.assignment;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'Invalid payload. Expecting { assignment: {...} }' });
      }

      const assignments = await readAssignments();
      const id = typeof incoming.id === 'string' ? incoming.id : generateStringId('assignment');
      const assignment: Assignment = {
        status: 'draft',
        assignedStudentIds: [],
        content: [],
        dueDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        ...incoming,
        id,
      } as Assignment;

      assignments.push(assignment);
      await writeAssignments(assignments);
      return res.status(201).json({ data: assignment });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('assignments/index handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
