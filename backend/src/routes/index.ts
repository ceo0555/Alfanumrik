import type { Express, Request, Response, NextFunction } from 'express';
import { profilesRouter } from './profiles';
import { assignmentsRouter } from './assignments';
import { authRouter } from './auth';
import { healthRouter } from './meta';
import { withErrorBoundary } from '../utils/errors';

export const registerApiRoutes = (app: Express): void => {
  app.use('/healthz', healthRouter);
  app.use('/api/profiles', withErrorBoundary(profilesRouter));
  app.use('/api/assignments', withErrorBoundary(assignmentsRouter));
  app.use('/api/auth', withErrorBoundary(authRouter));

  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
};
