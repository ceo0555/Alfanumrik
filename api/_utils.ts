import type { VercelRequest } from '@vercel/node';

export function parseJsonBody<T = Record<string, unknown>>(req: VercelRequest): T {
  if (typeof req.body === 'string' && req.body.length > 0) {
    return JSON.parse(req.body) as T;
  }
  if (req.body && typeof req.body === 'object') {
    return req.body as T;
  }
  return {} as T;
}

export function generateNumericId(): number {
  return Number(Date.now().toString().slice(-9) + Math.floor(Math.random() * 1000).toString().padStart(3, '0'));
}

export function generateStringId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
