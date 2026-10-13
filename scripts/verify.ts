import { randomUUID } from "node:crypto";
import { mkdir, open, writeFile } from "node:fs/promises";
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import path from "node:path";
import { pool } from "../src/lib/db";

const base = new URL(process.env.DATABASE_URL ?? "");
if (
  process.env.AUTH_MODE === "supabase" ||
  !["127.0.0.1", "localhost"].includes(base.hostname)
)
  throw new Error(
    "Acceptance verification requires the local development PostgreSQL instance; it never runs against hosted data.",
  );
const name = "academy_test_" + randomUUID().replaceAll("-", ""),
  directory = path.resolve(".academy-data/tests/" + name),
  root = process.cwd();
await mkdir(directory, { recursive: true, mode: 0o700 });
await pool.query(`CREATE DATABASE "${name}"`);
const database = new URL(base);
database.pathname = "/" + name;
const testEnv = {
  ...process.env,
  DATABASE_URL: database.toString(),
  AUTH_MODE: "local",
  DEMO_MODE: "false",
  ACADEMY_DATA_DIR: directory,
  ACADEMY_NEXT_DIST_DIR: ".next-test",
  ACADEMY_TEST_URL: "http://127.0.0.1:3100",
  ACADEMY_TEST_CREDENTIALS: path.join(directory, "demo-credentials.json"),
  ACADEMY_TEST_DATA_DIR: directory,
};
let server: ChildProcess | undefined,
  success = false;
const log = await open(path.join(directory, "server.log"), "a");
try {
  execFileSync(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "scripts/migrate.ts"],
    { env: testEnv, stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "scripts/seed.ts"],
    { env: testEnv, stdio: "inherit" },
  );
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3100",
    ],
    { env: testEnv, detached: true, stdio: ["ignore", log.fd, log.fd] },
  );
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null)
      throw new Error(
        "Isolated Next.js server exited; inspect the retained test server log.",
      );
    try {
      const response = await fetch(testEnv.ACADEMY_TEST_URL + "/api/health");
      if (response.ok) break;
      throw new Error("Not ready");
    } catch {
      if (attempt === 59)
        throw new Error("Isolated test server did not become ready.");
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  execFileSync(
    "python3",
    [
      process.env.ACADEMY_BROWSER_TESTS === "true"
        ? "tests/browser.py"
        : "tests/acceptance.py",
    ],
    { env: testEnv, stdio: "inherit" },
  );
  success = true;
  await writeFile(
    ".academy-data/last-test-run.json",
    JSON.stringify({ directory, database: name, result: "passed" }, null, 2),
  );
} finally {
  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
    await Promise.race([
      new Promise<void>((resolve) => server!.once("exit", () => resolve())),
      new Promise<void>((resolve) => setTimeout(resolve, 1000)),
    ]);
  }
  await log.close();
  await pool.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()",
    [name],
  );
  await pool.query(`DROP DATABASE "${name}"`);
  await pool.end();
  console.log(
    success
      ? "Isolated verification passed; the development database was unchanged."
      : "Verification failed; logs and result files are retained. The development database was unchanged.",
  );
}
