import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getResource, setResource } from '../resourceStore';
import { parseJsonBody } from '../_utils';
import type { Notification } from '../../types';

const RESOURCE_KEY = 'allNotifications';

const readNotifications = async (): Promise<Notification[]> => {
  const notifications = await getResource<Notification[]>(RESOURCE_KEY);
  return Array.isArray(notifications) ? notifications : [];
};

const writeNotifications = (notifications: Notification[]) =>
  setResource<Notification[]>(RESOURCE_KEY, notifications);

const resolveId = (value: string | string[] | undefined): string | null => {
  const slug = Array.isArray(value) ? value[0] : value;
  return slug ?? null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = resolveId(req.query.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid notification id.' });
    }

    const notifications = await readNotifications();
    const index = notifications.findIndex((notification) => notification.id === id);

    if (req.method === 'GET') {
      if (index === -1) {
        return res.status(404).json({ error: 'Notification not found.' });
      }
      return res.status(200).json({ data: notifications[index] });
    }

    if (req.method === 'PUT') {
      if (index === -1) {
        return res.status(404).json({ error: 'Notification not found.' });
      }
      const body = parseJsonBody<{ notification?: Partial<Notification> }>(req);
      const incoming = body.notification;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'Invalid payload. Expecting { notification: {...} }' });
      }
      const updated = { ...notifications[index], ...incoming, id };
      notifications[index] = updated;
      await writeNotifications(notifications);
      return res.status(200).json({ data: updated });
    }

    if (req.method === 'DELETE') {
      if (index === -1) {
        return res.status(404).json({ error: 'Notification not found.' });
      }
      notifications.splice(index, 1);
      await writeNotifications(notifications);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('notifications/[id] handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
