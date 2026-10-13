import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  currentUser,
  requireUser,
  requireRole,
  ApiError,
  checkOrigin,
  login,
  logout,
  createSession,
  demoEnabled,
  supabaseFor,
} from "@/lib/auth";
import {
  bootstrap,
  getLesson,
  getSubmission,
  scopedStudents,
} from "@/lib/queries";
import {
  saveSubmission,
  submitForReview,
  reviewSubmission,
  saveChecklist,
  submitAssessment,
} from "@/lib/workflows";
import {
  updateBranding,
  createCohort,
  inviteUser,
  updateUser,
  updateLesson,
  assignLesson,
  setAttendance,
  recordPayment,
  approveGate,
} from "@/lib/management";
import { uploadFile, downloadFile } from "@/lib/storage";
import { query } from "@/lib/db";
import { hashPassword, verifyPassword, tokenHash } from "@/lib/password";
import type { Profile } from "@/lib/types";
import { eventStream } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function json(value: unknown) {
  return NextResponse.json(value, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
async function handle(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  try {
    const p = (await context.params).path ?? [],
      method = request.method;
    if (method !== "GET") checkOrigin(request);
    if (method === "GET" && p[0] === "health") {
      await query("SELECT 1");
      return json({
        status: "ok",
        database: "PostgreSQL",
        auth: process.env.AUTH_MODE ?? "local",
      });
    }
    if (method === "GET" && p[0] === "bootstrap")
      return json(await bootstrap(await currentUser(request)));
    if (method === "POST" && p.join("/") === "auth/login") {
      const b = z
        .object({ email: z.email(), password: z.string().min(1).max(256) })
        .parse(await request.json());
      return await login(request, b.email, b.password);
    }
    if (method === "POST" && p.join("/") === "auth/logout")
      return await logout(request);
    if (method === "POST" && p.join("/") === "auth/demo") {
      if (!demoEnabled())
        throw new ApiError(
          403,
          "Demonstration accounts are disabled in this environment.",
        );
      const { role } = z
        .object({ role: z.enum(["student", "trainer", "admin"]) })
        .parse(await request.json());
      const emails = {
        student: "ayesha@demo.drcommerce.test",
        trainer: "hassan@demo.drcommerce.test",
        admin: "management@demo.drcommerce.test",
      };
      const user = (
        await query<Profile>(
          "SELECT * FROM profiles WHERE role=$1 AND email=$2 AND synthetic AND enabled",
          [role, emails[role]],
        )
      )[0];
      if (!user)
        throw new ApiError(503, "Demonstration data has not been seeded.");
      return await createSession(user, request);
    }
    if (method === "POST" && p.join("/") === "auth/recover") {
      const { email } = z
        .object({ email: z.email() })
        .parse(await request.json());
      if (process.env.AUTH_MODE !== "supabase")
        return json({
          message:
            "Local account recovery is handled by academy management. An administrator can generate a new password in People & Cohorts. No recovery email has been sent.",
        });
      const { client, apply } = supabaseFor(request),
        { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo:
            request.nextUrl.origin + "/auth/callback?next=/reset-password",
        });
      if (error)
        throw new ApiError(
          503,
          "Password recovery could not be requested. Check the configured email provider.",
        );
      return apply(
        json({
          message:
            "If this account is registered, Supabase will send recovery instructions.",
        }),
      );
    }
    if (method === "GET" && p[0] === "brand-assets")
      return await downloadFile(
        null,
        request,
        z.uuid().parse(p[1]),
        "branding",
      );
    const user = await requireUser(request);
    if (method === "GET" && p[0] === "events")
      return await eventStream(user, request);
    if (method === "POST" && p.join("/") === "auth/password") {
      const b = z
        .object({
          oldPassword: z.string().min(1).max(256),
          newPassword: z.string().min(12).max(256),
        })
        .parse(await request.json());
      if (process.env.AUTH_MODE === "supabase") {
        const { client, apply } = supabaseFor(request);
        const check = await client.auth.signInWithPassword({
          email: user.email,
          password: b.oldPassword,
        });
        if (check.error)
          throw new ApiError(401, "The current password is incorrect.");
        const changed = await client.auth.updateUser({
          password: b.newPassword,
        });
        if (changed.error) throw new ApiError(422, changed.error.message);
        const ended = await client.auth.signOut({ scope: "others" });
        return apply(
          json({
            message: ended.error
              ? "Password changed. Other-session revocation could not be confirmed."
              : "Password changed; other sessions revoked.",
          }),
        );
      }
      const row = (
        await query<{ password_hash: string }>(
          "SELECT password_hash FROM local_credentials WHERE profile_id=$1",
          [user.id],
        )
      )[0];
      if (!row || !verifyPassword(b.oldPassword, row.password_hash))
        throw new ApiError(401, "The current password is incorrect.");
      await query(
        "UPDATE local_credentials SET password_hash=$1 WHERE profile_id=$2",
        [hashPassword(b.newPassword), user.id],
      );
      await query(
        "DELETE FROM sessions WHERE profile_id=$1 AND token_hash<>$2",
        [user.id, tokenHash(request.cookies.get("drc_session")!.value)],
      );
      return json({
        message: "Password changed; other local sessions revoked.",
      });
    }
    if (method === "GET" && p[0] === "lessons")
      return json(await getLesson(user, z.uuid().parse(p[1])));
    if (method === "PATCH" && p[0] === "lessons" && p[2] === "checklist")
      return json(
        await saveChecklist(user, z.uuid().parse(p[1]), await request.json()),
      );
    if (method === "PATCH" && p[0] === "lessons" && p[2] === "notes") {
      const id = z.uuid().parse(p[1]);
      await getLesson(user, id);
      const b = z
        .object({ notes: z.string().max(12000) })
        .parse(await request.json());
      await query(
        "INSERT INTO lesson_notes(user_id,lesson_id,notes) VALUES($1,$2,$3) ON CONFLICT(user_id,lesson_id) DO UPDATE SET notes=$3,updated_at=now()",
        [user.id, id, b.notes],
      );
      return json({ saved: true });
    }
    if (method === "PUT" && p[0] === "lessons")
      return json(
        await updateLesson(user, z.uuid().parse(p[1]), await request.json()),
      );
    if (method === "POST" && p[0] === "lessons" && p[2] === "assign")
      return json(
        await assignLesson(user, z.uuid().parse(p[1]), await request.json()),
      );
    if (method === "POST" && p[0] === "lessons" && p[2] === "attendance")
      return json(
        await setAttendance(user, z.uuid().parse(p[1]), await request.json()),
      );
    if (method === "GET" && p[0] === "attendance") {
      requireRole(user, ["trainer", "admin"]);
      const ids = await scopedStudents(user);
      return json(
        await query(
          "SELECT student_id,present FROM attendance WHERE lesson_id=$1 AND student_id=ANY($2::uuid[])",
          [z.uuid().parse(request.nextUrl.searchParams.get("lessonId")), ids],
        ),
      );
    }
    if (method === "GET" && p[0] === "submissions" && p[1])
      return json(await getSubmission(user, z.uuid().parse(p[1])));
    if (
      (method === "POST" || method === "PATCH") &&
      p[0] === "submissions" &&
      !p[1]
    )
      return json(await saveSubmission(user, await request.json()));
    if (method === "POST" && p[0] === "submissions" && p[2] === "submit") {
      const { revision } = z
        .object({ revision: z.number().int().positive() })
        .parse(await request.json());
      return json(await submitForReview(user, z.uuid().parse(p[1]), revision));
    }
    if (method === "POST" && p[0] === "submissions" && p[2] === "review")
      return json(
        await reviewSubmission(
          user,
          z.uuid().parse(p[1]),
          await request.json(),
        ),
      );
    if (method === "POST" && p[0] === "uploads")
      return json(await uploadFile(user, request));
    if (method === "GET" && p[0] === "files")
      return await downloadFile(
        user,
        request,
        z.uuid().parse(p[1]),
        "evidence",
      );
    if (method === "GET" && p[0] === "resources" && p[2] === "download")
      return await downloadFile(
        user,
        request,
        z.uuid().parse(p[1]),
        "resource",
      );
    if (method === "POST" && p[0] === "resources") {
      requireRole(user, ["admin"]);
      const b = z
        .object({
          title: z.string().min(3).max(200),
          kind: z.enum(["SOP", "Policy", "Video", "Checklist", "Calculator"]),
          url: z.url().nullable(),
          description: z.string().min(10).max(10000),
          classification: z.enum([
            "synthetic",
            "internal",
            "pending",
            "verified",
          ]),
        })
        .parse(await request.json());
      if (b.url && !b.url.startsWith("https://"))
        throw new ApiError(422, "Resource links must use HTTPS.");
      return json(
        (
          await query(
            "INSERT INTO training_assets(organization_id,title,kind,url,description,classification) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",
            [
              user.organization_id,
              b.title,
              b.kind,
              b.url,
              b.description,
              b.classification,
            ],
          )
        )[0],
      );
    }
    if (method === "POST" && p[0] === "assessments")
      return json(
        await submitAssessment(
          user,
          z.uuid().parse(p[1]),
          await request.json(),
        ),
      );
    if (method === "PATCH" && p[0] === "notifications") {
      if (p[1] === "all")
        await query(
          "UPDATE notifications SET read_at=now() WHERE user_id=$1 AND read_at IS NULL",
          [user.id],
        );
      else
        await query(
          "UPDATE notifications SET read_at=now() WHERE id=$1 AND user_id=$2",
          [z.uuid().parse(p[1]), user.id],
        );
      return json({ saved: true });
    }
    if (method === "PUT" && p[0] === "branding")
      return json(await updateBranding(user, await request.json()));
    if (method === "POST" && p[0] === "cohorts")
      return json(await createCohort(user, await request.json()));
    if (method === "GET" && p[0] === "users") {
      requireRole(user, ["admin"]);
      return json(
        await query(
          "SELECT id,organization_id,email,display_name,role,enabled,synthetic,preferences FROM profiles WHERE organization_id=$1 ORDER BY display_name",
          [user.organization_id],
        ),
      );
    }
    if (method === "POST" && p[0] === "users")
      return json(
        await inviteUser(user, await request.json(), request.nextUrl.origin),
      );
    if (method === "PATCH" && p[0] === "users")
      return json(
        await updateUser(user, z.uuid().parse(p[1]), await request.json()),
      );
    if (method === "POST" && p[0] === "payments")
      return json(await recordPayment(user, await request.json()));
    if (method === "POST" && p[0] === "gates")
      return json(await approveGate(user, await request.json()));
    if (method === "PATCH" && p[0] === "profile") {
      const b = z
        .object({
          displayName: z.string().min(2).max(80),
          theme: z.enum(["light", "dark"]),
        })
        .parse(await request.json());
      await query(
        "UPDATE profiles SET display_name=$1,preferences=preferences||$2::jsonb WHERE id=$3",
        [b.displayName, JSON.stringify({ theme: b.theme }), user.id],
      );
      return json({ saved: true });
    }
    if (method === "POST" && p[0] === "live")
      throw new ApiError(
        403,
        "Live actions are disabled: no authorized marketplace integration or management-verified fulfillment arrangement is configured. Training approval does not grant live-account authorization.",
      );
    if (method === "GET" && p[0] === "export") {
      const data = await bootstrap(user),
        headers = [
          "Record ID",
          "Learner",
          "Form",
          "Product",
          "Status",
          "Classification",
          "Revision",
          "Updated",
        ],
        rows = data.submissions.map((s) => [
          s.id,
          s.student_name,
          s.form_key,
          s.title,
          s.status,
          s.classification,
          s.revision,
          s.updated_at,
        ]);
      return new NextResponse(
        "\ufeff" +
          [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n"),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition":
              'attachment; filename="dr-commerce-submissions.csv"',
            "Cache-Control": "private, no-store",
          },
        },
      );
    }
    throw new ApiError(404, "Endpoint not found.");
  } catch (error) {
    if (error instanceof ApiError)
      return NextResponse.json(
        { error: error.message, fields: error.fields },
        { status: error.status },
      );
    if (error instanceof z.ZodError)
      return NextResponse.json(
        {
          error: "Check the supplied values.",
          fields: Object.fromEntries(
            error.issues.map((i) => [i.path.join("."), i.message]),
          ),
        },
        { status: 422 },
      );
    if (error instanceof SyntaxError)
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    console.error(
      "Academy request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      {
        error:
          "The operation could not be completed. Your previous saved data has been preserved.",
      },
      { status: 500 },
    );
  }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
