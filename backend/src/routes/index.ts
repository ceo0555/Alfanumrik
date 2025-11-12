import type { Express, Request, Response, NextFunction } from 'express';
import { profilesRouter } from './profiles';
import { healthRouter } from './meta';
import { withErrorBoundary } from '../utils/errors';

export const registerApiRoutes = (app: Express): void => {
  app.use('/healthz', healthRouter);
  app.use('/api/profiles', withErrorBoundary(profilesRouter));

  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
};
