import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { query, transaction } from "./db";
import { ApiError, requireRole, demoEnabled } from "./auth";
import { getBranding, getLesson, canAccessStudent } from "./queries";
import { hashPassword } from "./password";
import { audit, notify } from "./workflows";
import type { Profile, Content, Cohort } from "./types";

export async function updateBranding(user: Profile, input: unknown) {
  requireRole(user, ["admin"]);
  const values = z
    .object({
      name: z.string().min(2).max(80),
      parentName: z.string().min(2).max(80),
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      font: z.enum([
        "Inter, ui-sans-serif, system-ui, sans-serif",
        "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif",
        "system-ui, sans-serif",
      ]),
      fee: z.number().nonnegative(),
      enrollmentFee: z.number().nonnegative(),
      balance: z.number().nonnegative(),
      passMark: z.number().min(1).max(100),
      weights: z.record(z.string(), z.number().min(0).max(100)),
    })
    .parse(input);
  if (
    Math.abs(Object.values(values.weights).reduce((a, b) => a + b, 0) - 100) >
    0.001
  )
    throw new ApiError(422, "Final assessment weights must total 100%.");
  if (values.enrollmentFee + values.balance !== values.fee)
    throw new ApiError(
      422,
      "Enrollment payment and remaining balance must equal the proposed total fee.",
    );
  await transaction(async (client) => {
    const old = await getBranding(user.organization_id, client);
    await query(
      "UPDATE organizations SET settings=$1 WHERE id=$2",
      [JSON.stringify({ ...old, ...values }), user.organization_id],
      client,
    );
    await audit(
      client,
      user,
      "organization.settings_updated",
      user.organization_id,
      { before: old, after: values },
    );
  });
  return getBranding(user.organization_id);
}
export async function createCohort(user: Profile, input: unknown) {
  requireRole(user, ["admin"]);
  const body = z
    .object({
      name: z.string().min(3).max(80),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      trainerId: z.uuid().optional(),
    })
    .parse(input);
  const course = (
    await query<{ id: string }>(
      "SELECT id FROM courses WHERE organization_id=$1 LIMIT 1",
      [user.organization_id],
    )
  )[0];
  if (!course)
    throw new ApiError(422, "Create the course before adding a cohort.");
  if (
    body.trainerId &&
    !(
      await query(
        "SELECT 1 FROM profiles WHERE id=$1 AND organization_id=$2 AND role='trainer' AND enabled",
        [body.trainerId, user.organization_id],
      )
    ).length
  )
    throw new ApiError(422, "Choose an active trainer in your organization.");
  return transaction(async (client) => {
    const row = (
      await query<Cohort>(
        "INSERT INTO cohorts(organization_id,course_id,name,start_date) VALUES($1,$2,$3,$4) RETURNING *",
        [user.organization_id, course.id, body.name, body.startDate],
        client,
      )
    )[0];
    if (body.trainerId)
      await query(
        "INSERT INTO trainer_assignments(trainer_id,cohort_id) VALUES($1,$2)",
        [body.trainerId, row.id],
        client,
      );
    await audit(client, user, "cohort.created", row.id, body);
    return row;
  });
}
export async function inviteUser(
  user: Profile,
  input: unknown,
  origin: string,
) {
  requireRole(user, ["admin"]);
  const body = z
    .object({
      email: z.email(),
      name: z.string().min(2).max(80),
      role: z.enum(["student", "trainer", "admin", "auditor"]),
      cohortId: z.uuid().optional(),
    })
    .parse(input);
  if (
    body.cohortId &&
    !(
      await query("SELECT 1 FROM cohorts WHERE id=$1 AND organization_id=$2", [
        body.cohortId,
        user.organization_id,
      ])
    ).length
  )
    throw new ApiError(403, "This cohort belongs to another organization.");
  if (
    (
      await query("SELECT 1 FROM profiles WHERE lower(email)=$1", [
        body.email.toLowerCase(),
      ])
    ).length
  )
    throw new ApiError(409, "An account with this email already exists.");
  let id: string = randomUUID(),
    password: string | null = randomBytes(18).toString("base64url");
  if (process.env.AUTH_MODE === "supabase") {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      throw new ApiError(
        503,
        "Set the server-only Supabase admin key to enable hosted invitations.",
      );
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } },
    );
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(
      body.email,
      { redirectTo: origin + "/auth/callback" },
    );
    if (error || !data.user)
      throw new ApiError(
        422,
        error?.message ?? "Invitation could not be created.",
      );
    id = data.user.id;
    password = null;
  }
  const profile = await transaction(async (client) => {
    const p = (
      await query<Profile>(
        "INSERT INTO profiles(id,organization_id,email,display_name,role,synthetic) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
        [
          id,
          user.organization_id,
          body.email.toLowerCase(),
          body.name,
          body.role,
          demoEnabled(),
        ],
        client,
      )
    )[0];
    if (password)
      await query(
        "INSERT INTO local_credentials(profile_id,password_hash) VALUES($1,$2)",
        [id, hashPassword(password)],
        client,
      );
    if (body.cohortId && body.role === "student")
      await query(
        "INSERT INTO enrollments(student_id,cohort_id) VALUES($1,$2)",
        [id, body.cohortId],
        client,
      );
    if (body.cohortId && ["trainer", "auditor"].includes(body.role))
      await query(
        "INSERT INTO trainer_assignments(trainer_id,cohort_id) VALUES($1,$2)",
        [id, body.cohortId],
        client,
      );
    await audit(
      client,
      user,
      "profile.invited",
      id,
      { email: body.email, role: body.role, cohortId: body.cohortId },
      body.role === "student" ? id : null,
    );
    return p;
  });
  return {
    profile,
    temporaryPassword: password,
    message: password
      ? "Account created. Share the generated password securely; it is shown only now."
      : "Supabase invitation sent. The recipient must accept the invitation.",
  };
}
export async function updateUser(user: Profile, id: string, input: unknown) {
  requireRole(user, ["admin"]);
  const body = z
    .object({
      enabled: z.boolean().optional(),
      role: z.enum(["student", "trainer", "admin", "auditor"]).optional(),
      cohortId: z.uuid().optional(),
      resetPassword: z.boolean().optional(),
    })
    .parse(input);
  const p = (
    await query<Profile>(
      "SELECT * FROM profiles WHERE id=$1 AND organization_id=$2",
      [id, user.organization_id],
    )
  )[0];
  if (!p) throw new ApiError(404, "User not found.");
  if (
    id === user.id &&
    (body.enabled === false || (body.role && body.role !== "admin"))
  )
    throw new ApiError(
      422,
      "Use another authorized manager to change your own administrative access.",
    );
  if (
    body.cohortId &&
    !(
      await query("SELECT 1 FROM cohorts WHERE id=$1 AND organization_id=$2", [
        body.cohortId,
        user.organization_id,
      ])
    ).length
  )
    throw new ApiError(403, "Choose a cohort in your organization.");
  if (body.resetPassword && process.env.AUTH_MODE === "supabase")
    throw new ApiError(
      422,
      "Use the hosted password-recovery flow for Supabase accounts.",
    );
  const password = body.resetPassword
    ? randomBytes(18).toString("base64url")
    : null;
  await transaction(async (client) => {
    await query(
      "UPDATE profiles SET enabled=$1,role=$2 WHERE id=$3",
      [body.enabled ?? p.enabled, body.role ?? p.role, id],
      client,
    );
    if (body.enabled === false || password)
      await query("DELETE FROM sessions WHERE profile_id=$1", [id], client);
    if (password)
      await query(
        "UPDATE local_credentials SET password_hash=$1 WHERE profile_id=$2",
        [hashPassword(password), id],
        client,
      );
    if (body.cohortId) {
      if ((body.role ?? p.role) === "student")
        await query(
          "INSERT INTO enrollments(student_id,cohort_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
          [id, body.cohortId],
          client,
        );
      else
        await query(
          "INSERT INTO trainer_assignments(trainer_id,cohort_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
          [id, body.cohortId],
          client,
        );
    }
    await audit(
      client,
      user,
      "profile.updated",
      id,
      {
        enabled: body.enabled,
        role: body.role,
        cohortId: body.cohortId,
        passwordReset: Boolean(password),
      },
      p.role === "student" ? id : null,
    );
  });
  return { ok: true, temporaryPassword: password };
}
export async function updateLesson(user: Profile, id: string, input: unknown) {
  requireRole(user, ["admin"]);
  const lesson = await getLesson(user, id);
  const body = z
    .object({
      title: z.string().min(3).max(200),
      objective: z.string().min(10).max(1000),
      explanation: z.string().min(30).max(16000),
      steps: z.array(z.string().min(3).max(2000)).min(1).max(30),
      script: z.string().min(20).max(20000),
      video: z.string().url().nullable().optional(),
      sections: z
        .object({
          dos: z.array(z.string().min(3).max(2000)).min(1).max(30),
          donts: z.array(z.string().min(3).max(2000)).min(1).max(30),
          precautions: z.array(z.string().min(3).max(2000)).min(1).max(30),
          example: z.string().min(10).max(16000),
          assignment: z.string().min(10).max(16000),
          evidence: z.string().min(10).max(6000),
          checklist: z
            .array(
              z.object({
                id: z.string().min(1).max(100),
                label: z.string().min(3).max(1000),
              }),
            )
            .min(1)
            .max(30),
          rubric: z
            .array(
              z.object({
                label: z.string().min(3).max(300),
                weight: z.number().min(0).max(100),
              }),
            )
            .min(1)
            .max(20),
          slides: z
            .array(
              z.object({
                title: z.string().min(3).max(200),
                body: z.string().min(3).max(4000),
              }),
            )
            .min(1)
            .max(40),
        })
        .optional(),
      questions: z.array(z.string().min(3).max(1000)).max(30).optional(),
      version: z.number().int().positive(),
    })
    .parse(input);
  if (
    body.sections &&
    (Math.abs(
      body.sections.rubric.reduce((sum, r) => sum + r.weight, 0) - 100,
    ) > 0.001 ||
      new Set(body.sections.checklist.map((c) => c.id)).size !==
        body.sections.checklist.length)
  )
    throw new ApiError(
      422,
      "Rubric weights must total 100% and checklist items must have distinct identifiers.",
    );
  if (
    body.video &&
    !/^https:\/\/(www\.)?(youtube\.com\/embed\/|player\.vimeo\.com\/video\/)/.test(
      body.video,
    )
  )
    throw new ApiError(422, "Use an HTTPS YouTube or Vimeo embed URL.");
  return transaction(async (client) => {
    const locked = (
      await query<{ version: number; content: Content }>(
        "SELECT version,content FROM lessons WHERE id=$1 FOR UPDATE",
        [id],
        client,
      )
    )[0];
    if (locked.version !== body.version)
      throw new ApiError(409, "The lesson changed. Reload before editing.");
    const content = {
      ...locked.content,
      ...body.sections,
      explanation: body.explanation,
      steps: body.steps,
      video: body.video ?? null,
      slides: body.sections?.slides ?? [
        { title: body.title, body: body.objective },
        ...body.steps.map((step, index) => ({
          title: `Step ${index + 1}`,
          body: step,
        })),
      ],
    };
    await query(
      "INSERT INTO document_versions(organization_id,lesson_id,editor_id,content,version) VALUES($1,$2,$3,$4,$5)",
      [
        user.organization_id,
        id,
        user.id,
        JSON.stringify({
          content: locked.content,
          title: lesson.title,
          script: lesson.script,
        }),
        locked.version,
      ],
      client,
    );
    await query(
      "UPDATE lessons SET title=$1,objective=$2,content=$3,version=version+1,updated_at=now() WHERE id=$4",
      [body.title, body.objective, JSON.stringify(content), id],
      client,
    );
    await query(
      "UPDATE instructor_notes SET script=$1,questions=$3 WHERE lesson_id=$2",
      [
        body.script,
        id,
        JSON.stringify(body.questions ?? lesson.questions ?? []),
      ],
      client,
    );
    await audit(client, user, "lesson.edited", id, {
      version: locked.version + 1,
    });
    return { saved: true, version: locked.version + 1 };
  });
}
export async function assignLesson(user: Profile, id: string, input: unknown) {
  requireRole(user, ["trainer", "admin"]);
  const lesson = await getLesson(user, id),
    body = z
      .object({
        cohortId: z.uuid(),
        deadline: z.iso.datetime({ offset: true }),
      })
      .parse(input);
  const cohort = (
    await query<Cohort>(
      "SELECT * FROM cohorts WHERE id=$1 AND organization_id=$2",
      [body.cohortId, user.organization_id],
    )
  )[0];
  if (!cohort || cohort.course_id !== lesson.course_id)
    throw new ApiError(403, "Choose an authorized cohort for this course.");
  if (
    user.role === "trainer" &&
    !(
      await query(
        "SELECT 1 FROM trainer_assignments WHERE trainer_id=$1 AND cohort_id=$2",
        [user.id, cohort.id],
      )
    ).length
  )
    throw new ApiError(403, "This cohort is not assigned to you.");
  return transaction(async (client) => {
    const a = (
      await query<{ id: string }>(
        "INSERT INTO assignments(organization_id,lesson_id,cohort_id,title,form_key,difficulty,instructions,required_evidence,rubric,assigned_by,due_at,classification) VALUES($1,$2,$3,$4,$5,'Intermediate',$6,$7,$8,$9,$10,'pending') RETURNING id",
        [
          user.organization_id,
          id,
          cohort.id,
          lesson.title + " — assigned practice",
          lesson.form_key,
          lesson.content.assignment,
          lesson.content.evidence,
          JSON.stringify(lesson.content.rubric),
          user.id,
          body.deadline,
        ],
        client,
      )
    )[0];
    for (const p of await query<{ student_id: string }>(
      "SELECT student_id FROM enrollments WHERE cohort_id=$1",
      [cohort.id],
      client,
    ))
      await notify(
        client,
        p.student_id,
        "A new practical task is ready",
        `${lesson.title}: submit the required evidence before the deadline.`,
      );
    await audit(client, user, "assignment.created", a.id, body);
    return a;
  });
}
export async function setAttendance(
  user: Profile,
  lessonId: string,
  input: unknown,
) {
  requireRole(user, ["trainer", "admin"]);
  await getLesson(user, lessonId);
  const body = z
    .object({ studentId: z.uuid(), present: z.boolean() })
    .parse(input);
  await canAccessStudent(user, body.studentId);
  await transaction(async (client) => {
    await query(
      "INSERT INTO attendance(student_id,lesson_id,trainer_id,present) VALUES($1,$2,$3,$4) ON CONFLICT(student_id,lesson_id) DO UPDATE SET present=$4,trainer_id=$3",
      [body.studentId, lessonId, user.id, body.present],
      client,
    );
    await audit(
      client,
      user,
      "attendance.updated",
      lessonId,
      body,
      body.studentId,
    );
  });
  return { saved: true };
}
export async function recordPayment(user: Profile, input: unknown) {
  requireRole(user, ["admin"]);
  const body = z
    .object({
      studentId: z.uuid(),
      amount: z.number().nonnegative(),
      reference: z.string().min(5).max(300),
      verified: z.boolean().default(false),
    })
    .parse(input);
  await canAccessStudent(user, body.studentId);
  return transaction(async (client) => {
    const record = (
      await query(
        "INSERT INTO payment_records(student_id,recorded_by,amount,reference,verified) VALUES($1,$2,$3,$4,$5) RETURNING id",
        [body.studentId, user.id, body.amount, body.reference, body.verified],
        client,
      )
    )[0];
    await audit(
      client,
      user,
      "payment.manually_recorded",
      null,
      {
        ...body,
        classification:
          "Manual administrative record; bank verification is a separate explicit confirmation.",
      },
      body.studentId,
    );
    return record;
  });
}
export async function approveGate(user: Profile, input: unknown) {
  requireRole(user, ["admin"]);
  const body = z
    .object({
      studentId: z.uuid(),
      gate: z.number().int().min(1).max(6),
      reason: z.string().min(20).max(3000),
    })
    .parse(input);
  await canAccessStudent(user, body.studentId);
  await transaction(async (client) => {
    await query(
      "INSERT INTO approvals(student_id,gate,approved_by,reason) VALUES($1,$2,$3,$4) ON CONFLICT(student_id,gate) DO UPDATE SET approved_by=$3,reason=$4,created_at=now()",
      [
        body.studentId,
        body.gate,
        user.id,
        "Management override: " + body.reason,
      ],
      client,
    );
    await notify(
      client,
      body.studentId,
      "Management reviewed your progression",
      body.reason,
    );
    await audit(
      client,
      user,
      "gate.management_override",
      null,
      body,
      body.studentId,
    );
  });
  return { approved: true };
}
