import type { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../services/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const requireAuth =
  (roles: string[] = []) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing authorization token' });
      return;
    }

    try {
      const token = header.substring('Bearer '.length);
      const payload = verifyAuthToken(token);
      if (roles.length > 0 && !roles.includes(payload.role)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      req.user = { id: payload.sub, role: payload.role };
      next();
    } catch (error) {
      console.error('Token verification failed', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  };
