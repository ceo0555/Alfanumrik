import type { PoolClient } from '@neondatabase/serverless';
import { execute, query, withTransaction } from './db';

interface ResourceRow<T = unknown> {
  resource: string;
  data: T;
}

const TABLE_NAME = 'app_resources';

let ensured = false;

const ensureTable = async () => {
  if (ensured) {
    return;
  }
  await execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      resource TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  ensured = true;
};

export const getResource = async <T = unknown>(resource: string): Promise<T | null> => {
  await ensureTable();
  const rows = await query<ResourceRow<T>>(
    `SELECT resource, data FROM ${TABLE_NAME} WHERE resource = $1`,
    [resource]
  );
  if (!rows.length) {
    return null;
  }
  return rows[0].data;
};

export const setResource = async <T = unknown>(resource: string, data: T): Promise<void> => {
  await ensureTable();
  await execute(
    `
    INSERT INTO ${TABLE_NAME} (resource, data, updated_at)
    VALUES ($1, $2::jsonb, NOW())
    ON CONFLICT (resource)
    DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
  `,
    [resource, JSON.stringify(data ?? null)]
  );
};

export const deleteResource = async (resource: string): Promise<void> => {
  await ensureTable();
  await execute(`DELETE FROM ${TABLE_NAME} WHERE resource = $1`, [resource]);
};

export const getResources = async (
  resources: string[]
): Promise<Record<string, unknown>> => {
  await ensureTable();
  if (resources.length === 0) {
    return {};
  }

  const placeholders = resources.map((_, index) => `$${index + 1}`).join(', ');
  const rows = await query<ResourceRow>(
    `SELECT resource, data FROM ${TABLE_NAME} WHERE resource IN (${placeholders})`,
    resources
  );

  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.resource] = row.data;
  }
  return result;
};

export const getAllResources = async (): Promise<Record<string, unknown>> => {
  await ensureTable();
  const rows = await query<ResourceRow>(`SELECT resource, data FROM ${TABLE_NAME}`);
  const data: Record<string, unknown> = {};
  for (const row of rows) {
    data[row.resource] = row.data;
  }
  return data;
};

export const withResourceTransaction = async <T>(
  handler: (client: PoolClient) => Promise<T>
): Promise<T> => {
  await ensureTable();
  return withTransaction(handler);
};
