import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { pool, query, transaction } from "../src/lib/db";

if (process.env.AUTH_MODE !== "supabase")
  throw new Error(
    "Administrator provisioning is for the explicitly configured Supabase project.",
  );
const email = z.email().parse(process.env.ACADEMY_ADMIN_EMAIL).toLowerCase();
const origin = z.url().parse(process.env.NEXT_PUBLIC_SITE_URL);
if (!origin.startsWith("https://"))
  throw new Error("Configure the HTTPS deployment URL first.");
if (
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL
)
  throw new Error(
    "Configure Supabase URL and server-only service role key securely.",
  );
const organization = await query<{ id: string }>(
  "SELECT id FROM organizations ORDER BY created_at LIMIT 2",
);
if (organization.length !== 1)
  throw new Error(
    "Seed a new, single-organization academy before provisioning.",
  );
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);
let identity: { id: string } | undefined;
for (let page = 1; ; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page,
    perPage: 200,
  });
  if (error)
    throw new Error("Could not inspect the configured project's Auth users.");
  identity = data.users.find((user) => user.email?.toLowerCase() === email);
  if (identity || data.users.length < 200) break;
}
if (!identity) {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: new URL(
      "/auth/callback?next=/reset-password",
      origin,
    ).toString(),
  });
  if (error || !data.user)
    throw new Error(
      "Administrator invitation failed. Check the project's email and redirect settings.",
    );
  identity = data.user;
}
await transaction(async (client) => {
  const existing = (
    await query<{ role: string; organization_id: string }>(
      "SELECT role,organization_id FROM profiles WHERE id=$1",
      [identity!.id],
      client,
    )
  )[0];
  if (
    existing &&
    (existing.role !== "admin" ||
      existing.organization_id !== organization[0].id)
  )
    throw new Error(
      "An existing profile has a different role or organization; use authorized management to change it.",
    );
  await query(
    "INSERT INTO profiles(id,organization_id,email,display_name,role,synthetic) VALUES($1,$2,$3,'Academy Management','admin',false) ON CONFLICT(id) DO NOTHING",
    [identity!.id, organization[0].id, email],
    client,
  );
  await query(
    "INSERT INTO audit_logs(actor_id,action,details) VALUES($1,'admin.provisioned',$2)",
    [
      identity!.id,
      JSON.stringify({ method: "explicit server-side provisioning" }),
    ],
    client,
  );
});
await pool.end();
console.log(
  "Administrator profile is mapped to the Supabase Auth identity. Accept the invitation and set a password; existing Auth users can sign in normally.",
);
