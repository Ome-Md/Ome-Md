import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const directory = path.join(root, ".academy-data");
await mkdir(directory, { recursive: true, mode: 0o700 });
let existing = "";
try {
  existing = await readFile(".env.local", "utf8");
} catch {}
if (
  /AUTH_MODE=supabase/.test(existing) ||
  process.env.AUTH_MODE === "supabase"
) {
  console.log(
    "Hosted Supabase is configured. Use db:migrate and db:seed explicitly against the intended project.",
  );
  process.exit(0);
}
let password: string;
try {
  password = (await readFile(path.join(directory, "postgres.env"), "utf8"))
    .split("POSTGRES_PASSWORD=")[1]
    .trim();
} catch {
  password = randomBytes(32).toString("hex");
  await writeFile(
    path.join(directory, "postgres.env"),
    `POSTGRES_USER=academy\nPOSTGRES_DB=academy\nPOSTGRES_PASSWORD=${password}\n`,
    { mode: 0o600 },
  );
}
if (!existing)
  await writeFile(
    ".env.local",
    `DATABASE_URL=postgresql://academy:${password}@127.0.0.1:54329/academy\nAUTH_MODE=local\nDEMO_MODE=true\nACADEMY_DATA_DIR=.academy-data\n`,
    { mode: 0o600 },
  );
let found = false;
try {
  execFileSync("docker", ["inspect", "dr-commerce-postgres"], {
    stdio: "ignore",
  });
  found = true;
} catch {}
if (found)
  execFileSync("docker", ["start", "dr-commerce-postgres"], {
    stdio: "ignore",
  });
else
  execFileSync(
    "docker",
    [
      "run",
      "--detach",
      "--name",
      "dr-commerce-postgres",
      "--restart",
      "unless-stopped",
      "--env-file",
      path.join(directory, "postgres.env"),
      "-p",
      "127.0.0.1:54329:5432",
      "-v",
      `${path.join(directory, "postgres")}:/var/lib/postgresql/data`,
      "postgres:17-alpine@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24",
    ],
    { stdio: "ignore" },
  );
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    execFileSync(
      "docker",
      [
        "exec",
        "dr-commerce-postgres",
        "pg_isready",
        "-U",
        "academy",
        "-d",
        "academy",
      ],
      { stdio: "ignore" },
    );
    break;
  } catch {
    if (attempt === 29) throw new Error("PostgreSQL did not become ready");
    await new Promise((r) => setTimeout(r, 500));
  }
}
console.log(
  "Local PostgreSQL is ready. Credentials are generated and retained only in ignored local files.",
);
