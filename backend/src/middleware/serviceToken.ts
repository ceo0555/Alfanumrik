import type { Request, Response, NextFunction } from 'express';

const SERVICE_TOKEN = process.env.SERVICE_TOKEN;

export const enforceServiceToken = (req: Request, res: Response, next: NextFunction): void => {
  if (!SERVICE_TOKEN) {
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing service token' });
    return;
  }

  const token = header.substring('Bearer '.length);
  if (token !== SERVICE_TOKEN) {
    res.status(401).json({ error: 'Invalid service token' });
    return;
  }

  next();
};
