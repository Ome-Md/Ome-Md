import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { z } from "zod";
import { query, transaction } from "./db";
import { ApiError, requireRole } from "./auth";
import {
  allowedCourseIds,
  canAccessStudent,
  getLesson,
  getSubmission,
  latestGate,
  getBranding,
} from "./queries";
import { getForm, formErrors } from "./forms";
import { calculateCost, supplierChecks } from "./domain";
import type { Profile, Submission, CostInputs, Lesson, Content } from "./types";

export const saveSchema = z.object({
  id: z.uuid().optional(),
  formKey: z.string().regex(/^F(?:0[1-9]|1[0-5])$/),
  lessonId: z.uuid().nullable().optional(),
  assignmentId: z.uuid().nullable().optional(),
  parentId: z.uuid().nullable().optional(),
  revision: z.number().int().positive().optional(),
  data: z.record(z.string(), z.unknown()),
  classification: z
    .enum(["synthetic", "internal", "pending"])
    .default("synthetic"),
});
export async function audit(
  client: PoolClient,
  user: Profile,
  action: string,
  entityId: string | null,
  details: unknown,
  studentId: string | null = user.role === "student" ? user.id : null,
) {
  await query(
    "INSERT INTO audit_logs(actor_id,student_id,action,entity_id,details) VALUES($1,$2,$3,$4,$5)",
    [user.id, studentId, action, entityId, JSON.stringify(details)],
    client,
  );
  await query(
    "SELECT pg_notify('academy_changes',$1)",
    [JSON.stringify({ organizationId: user.organization_id, studentId })],
    client,
  );
}
export async function notify(
  client: PoolClient,
  userId: string,
  title: string,
  message: string,
  submissionId?: string,
) {
  await query(
    "INSERT INTO notifications(user_id,title,message,submission_id) VALUES($1,$2,$3,$4)",
    [userId, title, message, submissionId ?? null],
    client,
  );
}
async function researchRoot(
  submission: Submission,
  client: PoolClient,
): Promise<string | null> {
  let s = submission;
  for (let n = 0; n < 15; n++) {
    if (s.form_key === "F02") return s.id;
    if (!s.parent_id) return null;
    const row = (
      await query<Submission>(
        "SELECT * FROM submissions WHERE id=$1",
        [s.parent_id],
        client,
      )
    )[0];
    if (!row) return null;
    s = row;
  }
  throw new ApiError(400, "Invalid product lineage.");
}
async function projectData(s: Submission, client: PoolClient) {
  const d = s.data,
    root = await researchRoot(s, client);
  if (s.form_key === "F02")
    await query(
      "INSERT INTO product_research_records(id,student_id,product_name,country,reference_url,observed_price,sold_quantity,details) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET product_name=$3,country=$4,reference_url=$5,observed_price=$6,sold_quantity=$7,details=$8",
      [
        s.id,
        s.student_id,
        s.title,
        d.country ?? null,
        d.ebayUrl ?? null,
        d.selling || null,
        d.soldQuantity || null,
        JSON.stringify(d),
      ],
      client,
    );
  if (s.form_key === "F03")
    await query(
      "INSERT INTO product_selection_decisions(id,student_id,product_id,scores) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET scores=$4",
      [s.id, s.student_id, root, JSON.stringify(d)],
      client,
    );
  if (s.form_key === "F04") {
    await query(
      "INSERT INTO suppliers(id,student_id,name,source_url,classification) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET name=$3,source_url=$4",
      [
        s.id,
        s.student_id,
        String(d.supplier ?? "Draft supplier"),
        String(d.sourceUrl ?? ""),
        s.classification,
      ],
      client,
    );
    await query(
      "INSERT INTO sourcing_records(id,student_id,product_id,supplier_id,product_rating,store_feedback,source_price,selected_variant,details) VALUES($1,$2,$3,$1,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET product_rating=$4,store_feedback=$5,source_price=$6,selected_variant=$7,details=$8",
      [
        s.id,
        s.student_id,
        root,
        d.rating || null,
        d.feedback || null,
        d.item || null,
        d.variant ?? null,
        JSON.stringify(d),
      ],
      client,
    );
  }
  if (s.form_key === "F06") {
    let calculation = {};
    try {
      calculation = calculateCost(costInputs(d));
    } catch {}
    await query(
      "INSERT INTO costing_records(id,student_id,product_id,source_id,inputs,calculation) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET inputs=$5,calculation=$6",
      [
        s.id,
        s.student_id,
        root,
        s.parent_id,
        JSON.stringify(d),
        JSON.stringify(calculation),
      ],
      client,
    );
  }
  if (s.form_key === "F07" && root) {
    await query(
      "DELETE FROM product_variations WHERE student_id=$1 AND product_id=$2",
      [s.student_id, root],
      client,
    );
    for (const variation of (Array.isArray(d.variations)
      ? d.variations
      : []) as { sku: string; variant: string; sourceVariant: string }[])
      await query(
        "INSERT INTO product_variations(student_id,product_id,sku,attributes) VALUES($1,$2,$3,$4)",
        [s.student_id, root, variation.sku, JSON.stringify(variation)],
        client,
      );
  }
  if (s.form_key === "F08")
    await query(
      "INSERT INTO listing_drafts(id,student_id,product_id,title,details) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET title=$4,details=$5",
      [s.id, s.student_id, root, s.title, JSON.stringify(d)],
      client,
    );
  if (s.form_key === "F10")
    await query(
      "INSERT INTO simulated_orders(id,student_id,product_id,details) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET details=$4",
      [s.id, s.student_id, root, JSON.stringify(d)],
      client,
    );
  if (s.form_key === "F11")
    await query(
      "INSERT INTO simulated_tracking_events(student_id,order_id,occurred_at,event) VALUES($1,$2,now(),$3)",
      [s.student_id, s.parent_id, String(d.event ?? "Draft observation")],
      client,
    );
  if (s.form_key === "F12")
    await query(
      "INSERT INTO support_tickets(id,student_id,details) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET details=$3",
      [s.id, s.student_id, JSON.stringify(d)],
      client,
    );
  if (s.form_key === "F13") {
    const costs = [
      "purchase",
      "shipping",
      "fees",
      "promotion",
      "refunds",
      "conversion",
    ].reduce((sum, key) => sum + Number(d[key] ?? 0), 0);
    await query(
      "INSERT INTO financial_records(id,student_id,product_id,inputs,calculation) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET inputs=$4,calculation=$5",
      [
        s.id,
        s.student_id,
        root,
        JSON.stringify(d),
        JSON.stringify({
          costs,
          profit: Number(d.revenue ?? 0) - costs,
          roi:
            costs > 0 ? ((Number(d.revenue ?? 0) - costs) / costs) * 100 : null,
        }),
      ],
      client,
    );
  }
}
export function costInputs(d: Record<string, unknown>): CostInputs {
  return {
    item: Number(d.item ?? 0),
    shipping: Number(d.shipping ?? 0),
    selling: Number(d.selling ?? 0),
    mode: d.mode === "actual" ? "actual" : "allowance",
    allowance: Number(d.allowance ?? 20),
    feePercent: Number(d.feePercent ?? 0),
    fixedFee: Number(d.fixedFee ?? 0),
    promotionPercent: Number(d.promotionPercent ?? 0),
    conversion: Number(d.conversion ?? 0),
    tax: Number(d.tax ?? 0),
    other: Number(d.other ?? 0),
  };
}
export async function saveSubmission(user: Profile, input: unknown) {
  requireRole(user, ["student"]);
  const body = saveSchema.parse(input),
    spec = getForm(body.formKey);
  if ((await latestGate(user.id)) < spec.gate)
    throw new ApiError(
      403,
      `Competency gate ${spec.gate} must be approved before this activity.`,
    );
  let original: Submission | undefined;
  if (body.id) {
    original = await getSubmission(user, body.id);
    if (original.student_id !== user.id || original.form_key !== spec.key)
      throw new ApiError(
        403,
        "You may edit only your own matching submission.",
      );
    if (!["draft", "changes_requested", "rejected"].includes(original.status))
      throw new ApiError(
        409,
        "This record is under review or approved. It cannot be edited.",
      );
    if (!body.revision)
      throw new ApiError(400, "A revision number is required for edits.");
  }
  const parentId = original?.parent_id ?? body.parentId ?? null;
  if (!spec.parent && parentId)
    throw new ApiError(
      422,
      "This form starts a new record and cannot reference an unrelated upstream record.",
    );
  if (spec.parent) {
    if (!parentId)
      throw new ApiError(400, "Select an approved upstream record.");
    const parent = await getSubmission(user, parentId);
    if (
      parent.student_id !== user.id ||
      parent.form_key !== spec.parent ||
      parent.status !== "approved"
    )
      throw new ApiError(
        403,
        "The linked upstream record must belong to you and be approved.",
      );
  }
  const lessonId = original?.lesson_id ?? body.lessonId ?? null;
  if (lessonId) {
    const lesson = await getLesson(user, lessonId);
    if (lesson.form_key !== spec.key)
      throw new ApiError(
        422,
        "This operating form does not match the lesson’s required practical task.",
      );
  }
  if (body.assignmentId) {
    const a = (
      await query<{
        organization_id: string;
        cohort_id: string | null;
        form_key: string;
        lesson_id: string | null;
      }>(
        "SELECT organization_id,cohort_id,form_key,lesson_id FROM assignments WHERE id=$1",
        [body.assignmentId],
      )
    )[0];
    if (
      !a ||
      a.organization_id !== user.organization_id ||
      a.form_key !== spec.key
    )
      throw new ApiError(403, "Assignment is not available.");
    if (a.lesson_id && a.lesson_id !== lessonId)
      throw new ApiError(
        422,
        "The practical task must be linked to its assigned lesson.",
      );
    if (
      a.cohort_id &&
      !(
        await query(
          "SELECT 1 FROM enrollments WHERE student_id=$1 AND cohort_id=$2",
          [user.id, a.cohort_id],
        )
      ).length
    )
      throw new ApiError(403, "Assignment belongs to another cohort.");
  }
  const data: Record<string, unknown> = {};
  for (const field of spec.fields) {
    const value = body.data[field.key];
    if (value !== undefined) {
      if (!["string", "number", "boolean"].includes(typeof value))
        throw new ApiError(400, `Invalid ${field.label}.`);
      if (typeof value === "string" && value.length > 12000)
        throw new ApiError(400, `${field.label} is too long.`);
      if (field.type === "number" && value !== "") {
        const number = Number(value);
        if (
          !Number.isFinite(number) ||
          (field.integer && !Number.isInteger(number)) ||
          number < 0 ||
          (field.max !== undefined && number > field.max)
        )
          throw new ApiError(400, `Invalid ${field.label}.`);
        data[field.key] = number;
      } else data[field.key] = value;
    }
  }
  if (Array.isArray(body.data.variations))
    data.variations = z
      .array(
        z.object({
          sku: z.string().max(80),
          variant: z.string().max(120),
          sourceVariant: z.string().max(120),
        }),
      )
      .max(40)
      .parse(body.data.variations);
  const id = body.id ?? randomUUID();
  await transaction(async (client) => {
    let result: Submission;
    if (original) {
      const previous = (
        await query<Submission>(
          "SELECT * FROM submissions WHERE id=$1 FOR UPDATE",
          [id],
          client,
        )
      )[0];
      if (
        previous.revision !== body.revision ||
        !["draft", "changes_requested", "rejected"].includes(previous.status)
      )
        throw new ApiError(
          409,
          "This record changed in another session. Reload before editing.",
        );
      await query(
        "INSERT INTO submission_versions(submission_id,student_id,revision,data,status) VALUES($1,$2,$3,$4,$5)",
        [
          id,
          user.id,
          previous.revision,
          JSON.stringify(previous.data),
          previous.status,
        ],
        client,
      );
      result = (
        await query<Submission>(
          "UPDATE submissions SET data=$1,title=$2,revision=revision+1,updated_at=now() WHERE id=$3 RETURNING *",
          [JSON.stringify(data), String(data.title ?? spec.short), id],
          client,
        )
      )[0];
    } else
      result = (
        await query<Submission>(
          "INSERT INTO submissions(id,student_id,assignment_id,lesson_id,parent_id,form_key,title,data,classification) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
          [
            id,
            user.id,
            body.assignmentId ?? null,
            lessonId,
            parentId,
            spec.key,
            String(data.title ?? spec.short),
            JSON.stringify(data),
            body.classification,
          ],
          client,
        )
      )[0];
    await projectData(result, client);
    await audit(client, user, "submission.draft_saved", id, {
      revision: result.revision,
      formKey: spec.key,
    });
  });
  return getSubmission(user, id);
}
export async function submitForReview(
  user: Profile,
  id: string,
  revision: number,
) {
  requireRole(user, ["student"]);
  const s = await getSubmission(user, id);
  if (s.student_id !== user.id)
    throw new ApiError(403, "You cannot submit another learner’s work.");
  const errors = formErrors(s.form_key, s.data);
  if (s.form_key === "F06")
    try {
      calculateCost(costInputs(s.data));
    } catch (error) {
      errors.selling = (error as Error).message;
    }
  if (s.form_key === "F04") {
    const checks = supplierChecks(
      Number(s.data.rating),
      Number(s.data.feedback),
      String(s.data.country),
      Number(s.data.deliveryDays),
    );
    if (!checks.numericQualified) errors.rating = checks.issues.join(" ");
  }
  if (Object.keys(errors).length)
    throw new ApiError(
      422,
      "Complete the required fields before submitting.",
      errors,
    );
  if (!s.evidence?.length)
    throw new ApiError(
      422,
      "Attach at least one clearly classified evidence file before submitting.",
      { evidence: "Evidence is required." },
    );
  if (s.lesson_id) {
    const lesson = await getLesson(user, s.lesson_id);
    if (lesson.content.checklist.some((c) => !lesson.responses?.[c.id]))
      throw new ApiError(
        422,
        "Complete the lesson’s readiness checklist before submitting.",
      );
  }
  await transaction(async (client) => {
    const current = (
      await query<Submission>(
        "SELECT * FROM submissions WHERE id=$1 FOR UPDATE",
        [id],
        client,
      )
    )[0];
    if (
      current.revision !== revision ||
      !["draft", "changes_requested", "rejected"].includes(current.status)
    )
      throw new ApiError(409, "Submission changed. Reload and try again.");
    await query(
      "INSERT INTO submission_versions(submission_id,student_id,revision,data,status) VALUES($1,$2,$3,$4,$5)",
      [
        id,
        user.id,
        current.revision,
        JSON.stringify(current.data),
        current.status,
      ],
      client,
    );
    await query(
      "UPDATE submissions SET status='submitted',revision=revision+1,submitted_at=now(),updated_at=now() WHERE id=$1",
      [id],
      client,
    );
    const trainers = await query<{ trainer_id: string }>(
      "SELECT DISTINCT t.trainer_id FROM trainer_assignments t JOIN enrollments e ON e.cohort_id=t.cohort_id WHERE e.student_id=$1",
      [user.id],
      client,
    );
    for (const trainer of trainers)
      await notify(
        client,
        trainer.trainer_id,
        "New submission for review",
        `${user.display_name} submitted ${s.title}.`,
        id,
      );
    await audit(client, user, "submission.submitted", id, {
      revision: revision + 1,
      formKey: s.form_key,
    });
  });
  return getSubmission(user, id);
}
async function updateGates(
  client: PoolClient,
  studentId: string,
  reviewerId: string,
  orgId: string,
) {
  const approved = await query<{ form_key: string; score: number }>(
    "SELECT s.form_key,avg(f.score)::float AS score FROM submissions s JOIN LATERAL(SELECT score,decision FROM trainer_feedback WHERE submission_id=s.id ORDER BY created_at DESC LIMIT 1) f ON true WHERE s.student_id=$1 AND s.status='approved' AND f.decision='approved' GROUP BY s.form_key",
    [studentId],
    client,
  );
  const has = (key: string) => approved.some((a) => a.form_key === key);
  const foundation =
    (
      await query<{ count: number }>(
        "SELECT count(*)::int AS count FROM lesson_completions lc JOIN lessons l ON l.id=lc.lesson_id WHERE lc.student_id=$1 AND l.day<=7",
        [studentId],
        client,
      )
    )[0].count >= 7;
  const quiz = await query(
    "SELECT 1 FROM assessment_attempts a JOIN assessments b ON b.id=a.assessment_id WHERE a.student_id=$1 AND b.gate=1 AND a.passed",
    [studentId],
    client,
  );
  const qualified = [
    foundation && has("F01") && quiz.length > 0,
    has("F02"),
    has("F04") && has("F06"),
    has("F08"),
    has("F10"),
    has("F11") && has("F12"),
    false,
  ];
  for (let index = 0; index < 6; index++)
    if (qualified[index])
      await query(
        "INSERT INTO approvals(student_id,gate,approved_by,reason) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",
        [
          studentId,
          index + 1,
          reviewerId,
          "Required evidence, trainer approval and competency conditions satisfied.",
        ],
        client,
      );
  const settings = await getBranding(orgId, client),
    score = Object.entries(settings.weights).reduce(
      (sum, [key, weight]) =>
        sum +
        (Number(approved.find((a) => a.form_key === key)?.score ?? 0) *
          weight) /
          100,
      0,
    );
  const critical = await query(
    "SELECT 1 FROM submissions s JOIN LATERAL(SELECT critical FROM trainer_feedback WHERE submission_id=s.id ORDER BY created_at DESC LIMIT 1) f ON true WHERE s.student_id=$1 AND f.critical AND s.status<>'approved'",
    [studentId],
    client,
  );
  const gates = await query<{ gate: number }>(
    "SELECT gate FROM approvals WHERE student_id=$1",
    [studentId],
    client,
  );
  const completed = (
    await query<{ count: number }>(
      "SELECT count(*)::int AS count FROM lesson_completions lc JOIN lessons l ON l.id=lc.lesson_id WHERE lc.student_id=$1 AND l.course_id IN(SELECT c.course_id FROM cohorts c JOIN enrollments e ON e.cohort_id=c.id WHERE e.student_id=$1)",
      [studentId],
      client,
    )
  )[0].count;
  if (
    has("F15") &&
    [1, 2, 3, 4, 5, 6].every((gate) => gates.some((g) => g.gate === gate)) &&
    Object.keys(settings.weights).every(has) &&
    completed >= 45 &&
    score >= settings.passMark &&
    !critical.length
  ) {
    await query(
      "INSERT INTO approvals(student_id,gate,approved_by,reason) VALUES($1,7,$2,'Final weighted competency assessment passed; all 45 daily practical milestones approved; no unresolved critical failures.') ON CONFLICT DO NOTHING",
      [studentId, reviewerId],
      client,
    );
    await query(
      "INSERT INTO certification_records(student_id,approved_by,score,status) VALUES($1,$2,$3,'qualified') ON CONFLICT(student_id) DO UPDATE SET score=$3,status='qualified'",
      [studentId, reviewerId, score],
      client,
    );
  } else {
    await query(
      "DELETE FROM approvals WHERE student_id=$1 AND gate=7",
      [studentId],
      client,
    );
    await query(
      "UPDATE certification_records SET status='review_required',score=$2 WHERE student_id=$1",
      [studentId, score],
      client,
    );
  }
}
export const reviewSchema = z.object({
  revision: z.number().int().positive(),
  decision: z.enum(["approved", "rejected", "changes_requested"]),
  score: z.number().min(0).max(100),
  comments: z.string().min(10).max(10000),
  fieldComments: z
    .array(
      z.object({
        field: z.string().max(100),
        comment: z.string().min(3).max(2000),
      }),
    )
    .default([]),
  critical: z.boolean().default(false),
  deadline: z.iso.datetime({ offset: true }).nullable().optional(),
  verified: z.boolean().default(false),
  overrideReason: z.string().min(20).max(4000).optional(),
});
export async function reviewSubmission(
  user: Profile,
  id: string,
  input: unknown,
) {
  requireRole(user, ["trainer", "admin", "auditor"]);
  const body = reviewSchema.parse(input),
    s = await getSubmission(user, id),
    settings = await getBranding(user.organization_id);
  if (body.overrideReason) requireRole(user, ["admin"]);
  if (body.decision === "changes_requested" && !body.fieldComments.length)
    throw new ApiError(
      422,
      "Add a comment to the exact field that needs correction.",
    );
  if (
    body.decision === "approved" &&
    (body.critical || body.score < settings.passMark)
  )
    throw new ApiError(
      422,
      "Approval requires the pass mark and no unresolved critical failure.",
    );
  for (const comment of body.fieldComments)
    if (
      !getForm(s.form_key).fields.some((f) => f.key === comment.field) &&
      comment.field !== "evidence"
    )
      throw new ApiError(
        422,
        "Feedback must refer to a valid submission field.",
      );
  await transaction(async (client) => {
    const locked = (
      await query<Submission>(
        "SELECT * FROM submissions WHERE id=$1 FOR UPDATE",
        [id],
        client,
      )
    )[0];
    if (
      (locked.status !== "submitted" &&
        !(
          body.overrideReason &&
          ["approved", "rejected", "changes_requested"].includes(locked.status)
        )) ||
      locked.revision !== body.revision
    )
      throw new ApiError(
        409,
        "This submission was already reviewed or changed. Reload it.",
      );
    if (body.decision === "approved") {
      if (Object.keys(formErrors(s.form_key, locked.data)).length)
        throw new ApiError(422, "Required fields are incomplete.");
      if (
        !(
          await query(
            "SELECT 1 FROM submission_evidence WHERE submission_id=$1",
            [id],
            client,
          )
        ).length
      )
        throw new ApiError(422, "Evidence is required for approval.");
      if (s.lesson_id) {
        const lesson = (
            await query<Lesson>(
              "SELECT * FROM lessons WHERE id=$1",
              [s.lesson_id],
              client,
            )
          )[0],
          responses = (
            await query<{ responses: Record<string, boolean> }>(
              "SELECT responses FROM checklist_responses WHERE student_id=$1 AND lesson_id=$2",
              [s.student_id, s.lesson_id],
              client,
            )
          )[0]?.responses;
        if (lesson.content.checklist.some((c) => !responses?.[c.id]))
          throw new ApiError(
            422,
            "The learner readiness checklist is incomplete.",
          );
      }
    }
    await query(
      "INSERT INTO trainer_feedback(submission_id,student_id,reviewer_id,decision,score,comments,field_comments,critical,deadline,revision) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [
        id,
        s.student_id,
        user.id,
        body.decision,
        body.score,
        body.overrideReason
          ? `Management reassessment: ${body.overrideReason}\n${body.comments}`
          : body.comments,
        JSON.stringify(body.fieldComments),
        body.critical,
        body.deadline ?? null,
        s.revision,
      ],
      client,
    );
    await query(
      "UPDATE submissions SET status=$1,classification=CASE WHEN $2 AND classification<>'synthetic' THEN 'verified' ELSE classification END,revision=revision+1,updated_at=now() WHERE id=$3",
      [body.decision, body.verified, id],
      client,
    );
    if (body.decision === "approved" && s.lesson_id)
      await query(
        "INSERT INTO lesson_completions(student_id,lesson_id,approved_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
        [s.student_id, s.lesson_id, user.id],
        client,
      );
    if (body.overrideReason && body.decision !== "approved") {
      if (s.lesson_id)
        await query(
          "DELETE FROM lesson_completions lc WHERE lc.student_id=$1 AND lc.lesson_id=$2 AND NOT EXISTS(SELECT 1 FROM submissions other WHERE other.student_id=$1 AND other.lesson_id=$2 AND other.status='approved')",
          [s.student_id, s.lesson_id],
          client,
        );
      const gateNumber =
        (
          {
            F01: 1,
            F02: 2,
            F04: 3,
            F06: 3,
            F08: 4,
            F10: 5,
            F11: 6,
            F12: 6,
          } as Record<string, number>
        )[s.form_key] ?? 7;
      await query(
        "DELETE FROM approvals WHERE student_id=$1 AND gate>=$2",
        [s.student_id, gateNumber],
        client,
      );
    }
    await updateGates(client, s.student_id, user.id, user.organization_id);
    await notify(
      client,
      s.student_id,
      body.decision === "approved"
        ? "Your work is approved"
        : body.decision === "changes_requested"
          ? "A correction will move you forward"
          : "Submission review completed",
      `${s.title}: ${body.comments}`,
      id,
    );
    await audit(
      client,
      user,
      body.overrideReason
        ? "assessment.management_override"
        : `review.${body.decision}`,
      id,
      {
        score: body.score,
        comments: body.comments,
        fieldComments: body.fieldComments,
        critical: body.critical,
        revision: s.revision,
        overrideReason: body.overrideReason,
      },
      s.student_id,
    );
  });
  return getSubmission(user, id);
}
export async function saveChecklist(user: Profile, id: string, input: unknown) {
  requireRole(user, ["student"]);
  const lesson = await getLesson(user, id),
    data = z.record(z.string(), z.boolean()).parse(input);
  if (
    Object.keys(data).some(
      (key) => !lesson.content.checklist.some((c) => c.id === key),
    )
  )
    throw new ApiError(400, "Unknown checklist item.");
  await query(
    "INSERT INTO checklist_responses(student_id,lesson_id,responses) VALUES($1,$2,$3) ON CONFLICT(student_id,lesson_id) DO UPDATE SET responses=$3,updated_at=now()",
    [user.id, id, JSON.stringify(data)],
  );
  return { saved: true };
}
export async function submitAssessment(
  user: Profile,
  id: string,
  input: unknown,
) {
  requireRole(user, ["student"]);
  const answers = z.array(z.number().int().nonnegative()).parse(input);
  const assessment = (
    await query<{
      id: string;
      course_id: string;
      gate: number;
      questions: { answer: number; choices: string[] }[];
      pass_mark: number;
    }>("SELECT * FROM assessments WHERE id=$1", [id])
  )[0];
  if (
    !assessment ||
    !(await allowedCourseIds(user)).includes(assessment.course_id)
  )
    throw new ApiError(404, "Assessment not found.");
  if (assessment.gate > (await latestGate(user.id)) + 1)
    throw new ApiError(403, "Earlier competency approval is required.");
  if (
    answers.length !== assessment.questions.length ||
    answers.some((a, index) => a >= assessment.questions[index].choices.length)
  )
    throw new ApiError(422, "Answer every assessment question.");
  const score =
      (assessment.questions.reduce(
        (sum, q, index) => sum + (answers[index] === q.answer ? 1 : 0),
        0,
      ) /
        answers.length) *
      100,
    passed = score >= assessment.pass_mark;
  await transaction(async (client) => {
    await query(
      "INSERT INTO assessment_attempts(student_id,assessment_id,answers,score,passed) VALUES($1,$2,$3,$4,$5)",
      [user.id, id, JSON.stringify(answers), score, passed],
      client,
    );
    await audit(client, user, "assessment.completed", id, { score, passed });
    if (passed && assessment.gate === 1) {
      const trainer = (
        await query<{ trainer_id: string }>(
          "SELECT t.trainer_id FROM trainer_assignments t JOIN enrollments e ON e.cohort_id=t.cohort_id WHERE e.student_id=$1 LIMIT 1",
          [user.id],
          client,
        )
      )[0];
      if (trainer)
        await updateGates(
          client,
          user.id,
          trainer.trainer_id,
          user.organization_id,
        );
    }
  });
  return {
    score,
    passed,
    message: passed
      ? "Knowledge check passed. Required practical evidence and trainer approval still control progression."
      : "Review the lesson and retake the knowledge check.",
  };
}
