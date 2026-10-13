import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { Pool } from "pg";
import { pool } from "../src/lib/db";

const base = new URL(process.env.DATABASE_URL ?? "");
if (
  process.env.AUTH_MODE === "supabase" ||
  !["127.0.0.1", "localhost"].includes(base.hostname)
)
  throw new Error("Seed verification runs only on an isolated local database.");
const name = "academy_seed_test_" + randomUUID().replaceAll("-", "");
await pool.query(`CREATE DATABASE "${name}"`);
base.pathname = "/" + name;
const testPool = new Pool({ connectionString: base.toString() });
try {
  const testEnv = {
    ...process.env,
    DATABASE_URL: base.toString(),
    AUTH_MODE: "supabase",
    DEMO_MODE: "false",
  };
  for (const script of ["migrate", "seed", "seed"])
    execFileSync(
      process.execPath,
      ["node_modules/tsx/dist/cli.mjs", "scripts/" + script + ".ts"],
      { env: testEnv, stdio: "inherit" },
    );
  const counts = (
    await testPool.query(
      "SELECT (SELECT count(*)::int FROM lessons) AS lessons,(SELECT count(*)::int FROM assignments) AS assignments,(SELECT count(*)::int FROM profiles) AS profiles,(SELECT count(*)::int FROM approvals) AS approvals,(SELECT count(*)::int FROM local_credentials) AS credentials,(SELECT count(*)::int FROM lesson_completions) AS completions",
    )
  ).rows[0];
  assert.deepEqual(counts, {
    lessons: 45,
    assignments: 109,
    profiles: 0,
    approvals: 0,
    credentials: 0,
    completions: 0,
  });
  console.log(
    "Hosted seed logic passed on isolated PostgreSQL: full curriculum, no fabricated accounts, credentials or progress; rerun preserved data.",
  );
} finally {
  await testPool.end();
  await pool.query(`DROP DATABASE "${name}"`);
  await pool.end();
}
