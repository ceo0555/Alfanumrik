import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

export const validateBody = <T>(schema: ZodSchema<T>): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation error', details: result.error.flatten() });
    }
    req.body = result.data;
    next();
  };
};
