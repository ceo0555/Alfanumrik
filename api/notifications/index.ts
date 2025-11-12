import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getResource, setResource } from '../resourceStore';
import { parseJsonBody, generateStringId } from '../_utils';
import type { Notification } from '../../types';

const RESOURCE_KEY = 'allNotifications';

const readNotifications = async (): Promise<Notification[]> => {
  const notifications = await getResource<Notification[]>(RESOURCE_KEY);
  return Array.isArray(notifications) ? notifications : [];
};

const writeNotifications = (notifications: Notification[]) =>
  setResource<Notification[]>(RESOURCE_KEY, notifications);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const notifications = await readNotifications();
      return res.status(200).json({ data: notifications });
    }

    if (req.method === 'POST') {
      const body = parseJsonBody<{ notification?: Partial<Notification> }>(req);
      const incoming = body.notification;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'Invalid payload. Expecting { notification: {...} }' });
      }

      const notifications = await readNotifications();
      const id = typeof incoming.id === 'string' ? incoming.id : generateStringId('notification');
      const notification: Notification = {
        type: 'general',
        date: new Date().toISOString(),
        isRead: false,
        ...incoming,
        id,
      } as Notification;

      notifications.unshift(notification);
      await writeNotifications(notifications);
      return res.status(201).json({ data: notification });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('notifications/index handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
