import type { Request, Response, NextFunction } from 'express';

const SERVICE_TOKEN = process.env.SERVICE_TOKEN;

export const enforceServiceToken = (req: Request, res: Response, next: NextFunction): void => {
  if (!SERVICE_TOKEN) {
    next();
    return;
  }

  const token = req.headers['x-service-token'];
  if (typeof token !== 'string') {
    res.status(401).json({ error: 'Missing service token' });
    return;
  }

  if (token !== SERVICE_TOKEN) {
    res.status(401).json({ error: 'Invalid service token' });
    return;
  }

  next();
};
