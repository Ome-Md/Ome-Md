import test from "node:test";
import assert from "node:assert/strict";
import { pool } from "../src/lib/db";

test("PostgreSQL RLS isolates cohorts, hides instructor notes and denies direct approval writes", async () => {
  const client = await pool.connect();
  try {
    const users = (
      await client.query(
        "SELECT id,email FROM profiles WHERE email IN ('bilal@demo.drcommerce.test','hassan@demo.drcommerce.test','ayesha@demo.drcommerce.test')",
      )
    ).rows;
    const bilal = users.find((u) => u.email.startsWith("bilal"))!.id,
      ayesha = users.find((u) => u.email.startsWith("ayesha"))!.id,
      hassan = users.find((u) => u.email.startsWith("hassan"))!.id;
    await client.query("BEGIN");
    await client.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [
      bilal,
    ]);
    await client.query("SET LOCAL ROLE authenticated");
    assert.equal(
      (await client.query("SELECT * FROM profiles WHERE id=$1", [ayesha]))
        .rowCount,
      0,
    );
    assert.equal(
      (await client.query("SELECT * FROM instructor_notes")).rowCount,
      0,
    );
    assert.equal(
      (await client.query("SELECT * FROM lessons WHERE day>7")).rowCount,
      0,
    );
    await assert.rejects(
      () =>
        client.query(
          "UPDATE submissions SET status='approved' WHERE student_id=$1",
          [bilal],
        ),
      (error: unknown) => (error as { code: string }).code === "42501",
    );
    await client.query("ROLLBACK");
    await client.query("BEGIN");
    await client.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [
      hassan,
    ]);
    await client.query("SET LOCAL ROLE authenticated");
    assert.equal(
      (await client.query("SELECT * FROM profiles WHERE id=$1", [bilal]))
        .rowCount,
      0,
    );
    assert.ok(
      (await client.query("SELECT * FROM profiles WHERE id=$1", [ayesha]))
        .rowCount,
    );
    assert.ok((await client.query("SELECT * FROM instructor_notes")).rowCount);
    await assert.rejects(
      () => client.query("SELECT * FROM local_credentials"),
      (error: unknown) => (error as { code: string }).code === "42501",
    );
    await client.query("ROLLBACK");
  } finally {
    await client.query("ROLLBACK").catch(() => {});
    client.release();
    await pool.end();
  }
});
