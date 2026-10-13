import { Pool, types, type PoolClient } from "pg";
import * as nextEnv from "@next/env";

const envModule = nextEnv as typeof nextEnv & { default?: typeof nextEnv };
const loadEnvironment =
  envModule.loadEnvConfig ?? envModule.default?.loadEnvConfig;
if (!loadEnvironment)
  throw new Error("Next.js environment loader is unavailable.");
loadEnvironment(process.cwd());
types.setTypeParser(1700, Number);
const globalDb = globalThis as unknown as { academyPool?: Pool };
export const pool =
  globalDb.academyPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 8,
    connectionTimeoutMillis: 10000,
  });
if (process.env.NODE_ENV !== "production") globalDb.academyPool = pool;

export async function query<T = Record<string, unknown>>(
  sql: string,
  values: unknown[] = [],
  client?: PoolClient,
): Promise<T[]> {
  const result = await (client ?? pool).query(sql, values);
  return result.rows as T[];
}
export async function transaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
