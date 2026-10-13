import { query } from "./db";
import { ApiError } from "./auth";
import { defaultBranding } from "./branding";
import type { PoolClient } from "pg";
import type {
  Bootstrap,
  Profile,
  Branding,
  Lesson,
  Submission,
  Feedback,
  Evidence,
} from "./types";

export async function scopedStudents(user: Profile): Promise<string[]> {
  if (user.role === "student") return [user.id];
  if (user.role === "admin")
    return (
      await query<{ id: string }>(
        "SELECT id FROM profiles WHERE organization_id=$1 AND role='student'",
        [user.organization_id],
      )
    ).map((p) => p.id);
  return (
    await query<{ id: string }>(
      "SELECT DISTINCT e.student_id AS id FROM enrollments e JOIN trainer_assignments t ON t.cohort_id=e.cohort_id JOIN profiles p ON p.id=e.student_id WHERE t.trainer_id=$1 AND p.organization_id=$2",
      [user.id, user.organization_id],
    )
  ).map((p) => p.id);
}
export async function canAccessStudent(user: Profile, studentId: string) {
  if (!(await scopedStudents(user)).includes(studentId))
    throw new ApiError(
      403,
      "This learner record is outside your authorized cohort.",
    );
}
export async function getBranding(
  orgId?: string,
  client?: PoolClient,
): Promise<Branding> {
  const row = (
    await query<{ settings: Partial<Branding> }>(
      orgId
        ? "SELECT settings FROM organizations WHERE id=$1"
        : "SELECT settings FROM organizations ORDER BY created_at LIMIT 1",
      orgId ? [orgId] : [],
      client,
    )
  )[0];
  return { ...defaultBranding, ...row?.settings };
}
export async function latestGate(studentId: string) {
  const rows = await query<{ gate: number }>(
    "SELECT gate FROM approvals WHERE student_id=$1 ORDER BY gate",
    [studentId],
  );
  let gate = 0;
  for (const row of rows) {
    if (row.gate !== gate + 1) break;
    gate = row.gate;
  }
  return gate;
}
export async function allowedCourseIds(user: Profile) {
  const sql =
    user.role === "admin"
      ? "SELECT id FROM courses WHERE organization_id=$1"
      : user.role === "student"
        ? "SELECT DISTINCT c.course_id AS id FROM cohorts c JOIN enrollments e ON e.cohort_id=c.id WHERE e.student_id=$1"
        : "SELECT DISTINCT c.course_id AS id FROM cohorts c JOIN trainer_assignments t ON t.cohort_id=c.id WHERE t.trainer_id=$1";
  return (
    await query<{ id: string }>(sql, [
      user.role === "admin" ? user.organization_id : user.id,
    ])
  ).map((r) => r.id);
}
export async function getLesson(user: Profile, id: string): Promise<Lesson> {
  const row = (
    await query<Lesson>("SELECT * FROM lessons WHERE id=$1", [id])
  )[0];
  if (!row || !(await allowedCourseIds(user)).includes(row.course_id))
    throw new ApiError(404, "Lesson not found in your assigned course.");
  if (
    user.role === "student" &&
    row.required_gate > (await latestGate(user.id))
  )
    throw new ApiError(
      403,
      `This lesson requires competency gate ${row.required_gate} approval.`,
    );
  const responses = (
    await query<{ responses: Record<string, boolean> }>(
      "SELECT responses FROM checklist_responses WHERE student_id=$1 AND lesson_id=$2",
      [user.id, id],
    )
  )[0];
  row.responses = responses?.responses ?? {};
  row.notes =
    (
      await query<{ notes: string }>(
        "SELECT notes FROM lesson_notes WHERE user_id=$1 AND lesson_id=$2",
        [user.id, id],
      )
    )[0]?.notes ?? "";
  if (user.role === "trainer" || user.role === "admin")
    Object.assign(
      row,
      (
        await query<{ script: string; questions: string[] }>(
          "SELECT script,questions FROM instructor_notes WHERE lesson_id=$1",
          [id],
        )
      )[0],
    );
  return row;
}
export async function getSubmission(
  user: Profile,
  id: string,
): Promise<Submission> {
  const row = (
    await query<Submission>(
      "SELECT s.*,p.display_name AS student_name FROM submissions s JOIN profiles p ON p.id=s.student_id WHERE s.id=$1",
      [id],
    )
  )[0];
  if (!row) throw new ApiError(404, "Submission not found.");
  await canAccessStudent(user, row.student_id);
  row.rubric = (
    await query<{ rubric: { label: string; weight: number }[] }>(
      "SELECT COALESCE(a.rubric,l.content->'rubric') AS rubric FROM submissions s LEFT JOIN assignments a ON a.id=s.assignment_id LEFT JOIN lessons l ON l.id=s.lesson_id WHERE s.id=$1",
      [id],
    )
  )[0]?.rubric;
  row.feedback = await query<Feedback>(
    "SELECT f.*,p.display_name AS reviewer_name FROM trainer_feedback f JOIN profiles p ON p.id=f.reviewer_id WHERE submission_id=$1 ORDER BY f.created_at DESC",
    [id],
  );
  row.evidence = await query<Evidence>(
    "SELECT id,submission_id,filename,mime_type,size,classification FROM submission_evidence WHERE submission_id=$1 ORDER BY created_at",
    [id],
  );
  row.history = await query(
    "SELECT revision,status,created_at FROM submission_versions WHERE submission_id=$1 ORDER BY created_at DESC",
    [id],
  );
  if (row.form_key === "F06")
    row.calculation = (
      await query<{ calculation: Submission["calculation"] }>(
        "SELECT calculation FROM costing_records WHERE id=$1",
        [id],
      )
    )[0]?.calculation;
  return row;
}
export async function bootstrap(user: Profile | null): Promise<Bootstrap> {
  const branding = await getBranding(user?.organization_id);
  const empty: Bootstrap = {
    user,
    demo:
      process.env.AUTH_MODE !== "supabase" &&
      process.env.DEMO_MODE === "true" &&
      !process.env.VERCEL,
    branding,
    cohorts: [],
    lessons: [],
    modules: [],
    submissions: [],
    assignments: [],
    notifications: [],
    gates: [],
    students: [],
    resources: [],
    assessments: [],
    attempts: [],
    payments: [],
    certificates: [],
    audit: [],
  };
  if (!user) return empty;
  const students = await scopedStudents(user),
    courses = await allowedCourseIds(user),
    gate = user.role === "student" ? await latestGate(user.id) : 7;
  const cohortSql =
    user.role === "admin"
      ? "SELECT c.*,count(e.id)::int AS students FROM cohorts c LEFT JOIN enrollments e ON e.cohort_id=c.id WHERE c.organization_id=$1 GROUP BY c.id"
      : user.role === "student"
        ? "SELECT c.* FROM cohorts c JOIN enrollments e ON e.cohort_id=c.id WHERE e.student_id=$1"
        : "SELECT c.* FROM cohorts c JOIN trainer_assignments t ON t.cohort_id=c.id WHERE t.trainer_id=$1";
  const [
    cohorts,
    lessons,
    modules,
    submissions,
    assignments,
    notifications,
    gates,
    roster,
    resources,
    assessments,
    attempts,
    payments,
    certificates,
    audit,
  ] = await Promise.all([
    query<Bootstrap["cohorts"][number]>(cohortSql, [
      user.role === "admin" ? user.organization_id : user.id,
    ]),
    query<Lesson>(
      "SELECT id,module_id,course_id,day,title,objective,minutes,required_gate,form_key,version FROM lessons WHERE course_id=ANY($1::uuid[]) ORDER BY day",
      [courses],
    ),
    query<Bootstrap["modules"][number]>(
      "SELECT * FROM modules WHERE course_id=ANY($1::uuid[]) ORDER BY stage",
      [courses],
    ),
    query<Submission>(
      "SELECT s.*,p.display_name AS student_name,(SELECT c.name FROM enrollments e JOIN cohorts c ON c.id=e.cohort_id WHERE e.student_id=s.student_id LIMIT 1) AS cohort_name,(SELECT f.score FROM trainer_feedback f WHERE f.submission_id=s.id ORDER BY f.created_at DESC LIMIT 1) AS score,(SELECT f.critical FROM trainer_feedback f WHERE f.submission_id=s.id ORDER BY f.created_at DESC LIMIT 1) AS critical FROM submissions s JOIN profiles p ON p.id=s.student_id WHERE s.student_id=ANY($1::uuid[]) ORDER BY s.updated_at DESC",
      [students],
    ),
    query<Bootstrap["assignments"][number]>(
      "SELECT * FROM assignments WHERE organization_id=$1 AND (cohort_id IS NULL OR cohort_id IN (SELECT c.id FROM cohorts c WHERE c.course_id=ANY($2::uuid[]) AND (EXISTS(SELECT 1 FROM enrollments e WHERE e.cohort_id=c.id AND e.student_id=$3) OR EXISTS(SELECT 1 FROM trainer_assignments t WHERE t.cohort_id=c.id AND t.trainer_id=$3) OR $4='admin'))) ORDER BY due_at NULLS LAST,title",
      [user.organization_id, courses, user.id, user.role],
    ),
    query<Bootstrap["notifications"][number]>(
      "SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30",
      [user.id],
    ),
    query<Bootstrap["gates"][number]>(
      "SELECT * FROM approvals WHERE student_id=$1 ORDER BY gate",
      [user.id],
    ),
    query<Bootstrap["students"][number]>(
      "SELECT p.*,(SELECT c.name FROM enrollments e JOIN cohorts c ON c.id=e.cohort_id WHERE e.student_id=p.id LIMIT 1) AS cohort_name,(SELECT count(*)::int FROM lesson_completions l WHERE l.student_id=p.id) AS completed,(SELECT count(*)::int FROM submissions s WHERE s.student_id=p.id AND s.status='approved') AS approved,(SELECT count(*)::int FROM submissions s WHERE s.student_id=p.id AND s.status='submitted') AS pending,(SELECT round(avg(f.score),1) FROM trainer_feedback f WHERE f.student_id=p.id) AS score FROM profiles p WHERE p.id=ANY($1::uuid[]) ORDER BY p.display_name",
      [students],
    ),
    query<Bootstrap["resources"][number]>(
      "SELECT * FROM training_assets WHERE organization_id=$1 ORDER BY title",
      [user.organization_id],
    ),
    query<{
      id: string;
      title: string;
      gate: number;
      pass_mark: number;
      questions: { question: string; choices: string[]; answer: number }[];
    }>(
      "SELECT id,title,gate,pass_mark,questions FROM assessments WHERE course_id=ANY($1::uuid[]) ORDER BY gate",
      [courses],
    ),
    query<Bootstrap["attempts"][number]>(
      "SELECT assessment_id,score,passed FROM assessment_attempts WHERE student_id=$1 ORDER BY created_at DESC",
      [user.id],
    ),
    user.role === "admin" || user.role === "student"
      ? query<Bootstrap["payments"][number]>(
          "SELECT id,student_id,amount,verified,reference,created_at FROM payment_records WHERE student_id=ANY($1::uuid[])",
          [students],
        )
      : Promise.resolve([]),
    query<Bootstrap["certificates"][number]>(
      "SELECT id,student_id,score,status FROM certification_records WHERE student_id=ANY($1::uuid[])",
      [students],
    ),
    user.role === "admin"
      ? query<Bootstrap["audit"][number]>(
          "SELECT a.id,a.action,a.details,a.created_at,p.display_name AS actor_name FROM audit_logs a LEFT JOIN profiles p ON p.id=a.actor_id WHERE p.organization_id=$1 ORDER BY a.created_at DESC LIMIT 50",
          [user.organization_id],
        )
      : Promise.resolve([]),
  ]);
  const completed = await query<{ lesson_id: string }>(
    "SELECT lesson_id FROM lesson_completions WHERE student_id=$1",
    [user.id],
  );
  return {
    ...empty,
    cohorts,
    lessons: lessons.map((l) => ({
      ...l,
      locked: l.required_gate > gate,
      completed: completed.some((c) => c.lesson_id === l.id),
    })),
    modules,
    submissions,
    assignments,
    notifications,
    gates,
    students: roster,
    resources,
    assessments: assessments.map((a) => ({
      ...a,
      questions: a.questions.map(({ answer: _, ...q }) => q),
    })),
    attempts,
    payments,
    certificates,
    audit,
  } as Bootstrap;
}
