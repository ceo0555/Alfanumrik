import { Pool } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined for backend service.');
}

const pool = new Pool({ connectionString });

export const db = {
  async query<T>(text: string, params: unknown[] = []): Promise<T[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows as T[];
    } finally {
      client.release();
    }
  },
};
