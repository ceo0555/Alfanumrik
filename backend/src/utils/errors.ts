import type { Router, RequestHandler } from 'express';

export const withErrorBoundary = (router: Router): Router => {
  const handlers = router.stack?.map((layer) => layer.handle) ?? [];
  router.stack = router.stack?.map((layer, index) => {
    const handler = handlers[index];
    if (typeof handler !== 'function') return layer;
    const wrapped: RequestHandler = async (req, res, next) => {
      try {
        await Promise.resolve(handler(req, res, next));
      } catch (error) {
        next(error);
      }
    };
    layer.handle = wrapped;
    return layer;
  });
  return router;
};
