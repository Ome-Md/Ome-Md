import { readFile, readdir } from "node:fs/promises";
import { pool } from "../src/lib/db";

await pool.query(
  "CREATE TABLE IF NOT EXISTS academy_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
);
for (const file of (await readdir("supabase/migrations"))
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  if (
    (await pool.query("SELECT 1 FROM academy_migrations WHERE name=$1", [file]))
      .rows.length
  )
    continue;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(await readFile("supabase/migrations/" + file, "utf8"));
    await client.query("INSERT INTO academy_migrations(name) VALUES($1)", [
      file,
    ]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
await pool.end();
console.log("Academy schema and row-level security applied.");
