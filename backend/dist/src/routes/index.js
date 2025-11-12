import { profilesRouter } from './profiles';
import { healthRouter } from './meta';
import { withErrorBoundary } from '../utils/errors';
export const registerApiRoutes = (app) => {
    app.use('/healthz', healthRouter);
    app.use('/api/profiles', withErrorBoundary(profilesRouter));
    app.use((err, req, res, _next) => {
        console.error('Unhandled error', err);
        res.status(500).json({ error: 'Internal server error' });
    });
};
