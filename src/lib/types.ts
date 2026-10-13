export type Role = "student" | "trainer" | "admin" | "auditor";
export type Classification = "synthetic" | "internal" | "pending" | "verified";
export type Status =
  "draft" | "submitted" | "changes_requested" | "approved" | "rejected";
export interface Profile {
  id: string;
  organization_id: string;
  email: string;
  display_name: string;
  role: Role;
  enabled: boolean;
  synthetic: boolean;
  preferences: Record<string, unknown>;
}
export interface Branding {
  name: string;
  parentName: string;
  primary: string;
  secondary: string;
  font: string;
  logo: string | null;
  parentLogo: string | null;
  fee: number;
  enrollmentFee: number;
  balance: number;
  passMark: number;
  weights: Record<string, number>;
}
export interface Cohort {
  id: string;
  name: string;
  start_date: string;
  course_id: string;
  status: string;
  students?: number;
}
export interface Content {
  explanation: string;
  steps: string[];
  dos: string[];
  donts: string[];
  precautions: string[];
  checklist: { id: string; label: string }[];
  example: string;
  assignment: string;
  evidence: string;
  rubric: { label: string; weight: number }[];
  resources: { label: string; url: string }[];
  slides: { title: string; body: string }[];
  video: string | null;
  classification: Classification;
}
export interface Lesson {
  id: string;
  module_id: string;
  course_id: string;
  day: number;
  title: string;
  objective: string;
  minutes: number;
  required_gate: number;
  form_key: string;
  content: Content;
  version: number;
  script?: string;
  questions?: string[];
  completed?: boolean;
  locked?: boolean;
  responses?: Record<string, boolean>;
  notes?: string;
}
export interface Submission {
  id: string;
  student_id: string;
  assignment_id: string | null;
  lesson_id: string | null;
  parent_id: string | null;
  form_key: string;
  title: string;
  status: Status;
  data: Record<string, unknown>;
  revision: number;
  classification: Classification;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  student_name?: string;
  cohort_name?: string;
  feedback?: Feedback[];
  evidence?: Evidence[];
  history?: { revision: number; status: Status; created_at: string }[];
  calculation?: CostResult;
  score?: number | null;
  critical?: boolean;
  rubric?: { label: string; weight: number }[];
}
export interface Feedback {
  id: string;
  decision: Status;
  score: number | null;
  comments: string;
  field_comments: { field: string; comment: string }[];
  critical: boolean;
  deadline: string | null;
  revision: number;
  created_at: string;
  reviewer_name?: string;
}
export interface Evidence {
  id: string;
  submission_id: string;
  filename: string;
  mime_type: string;
  size: number;
  classification: Classification;
}
export interface Assignment {
  id: string;
  lesson_id: string | null;
  cohort_id: string | null;
  title: string;
  form_key: string;
  difficulty: string;
  instructions: string;
  required_evidence: string;
  rubric: { label: string; weight: number }[];
  max_score: number;
  classification: Classification;
  due_at: string | null;
}
export interface Notification {
  id: string;
  title: string;
  message: string;
  submission_id: string | null;
  read_at: string | null;
  created_at: string;
}
export interface Resource {
  id: string;
  title: string;
  kind: string;
  url: string | null;
  classification: Classification;
  description: string;
}
export interface Assessment {
  id: string;
  title: string;
  gate: number;
  pass_mark: number;
  questions: { question: string; choices: string[] }[];
}
export interface CostInputs {
  item: number;
  shipping: number;
  selling: number;
  mode: "allowance" | "actual";
  allowance: number;
  feePercent: number;
  fixedFee: number;
  promotionPercent: number;
  conversion: number;
  tax: number;
  other: number;
}
export interface CostResult {
  investment: number;
  profit: number;
  roi: number;
  margin: number;
  minimumPrice: number;
  fees: number;
  allowanceCost: number;
  inTarget: boolean;
  warnings: string[];
}
export interface Bootstrap {
  user: Profile | null;
  demo: boolean;
  branding: Branding;
  cohorts: Cohort[];
  lessons: Lesson[];
  modules: { id: string; stage: number; title: string; description: string }[];
  submissions: Submission[];
  assignments: Assignment[];
  notifications: Notification[];
  gates: { gate: number; reason: string; created_at: string }[];
  students: (Profile & {
    cohort_name: string;
    completed: number;
    approved: number;
    pending: number;
    score: number | null;
  })[];
  resources: Resource[];
  assessments: Assessment[];
  attempts: { assessment_id: string; score: number; passed: boolean }[];
  payments: {
    id: string;
    student_id: string;
    amount: number;
    verified: boolean;
    reference: string;
    created_at: string;
  }[];
  certificates: {
    id: string;
    student_id: string;
    score: number;
    status: string;
  }[];
  audit: {
    id: string;
    action: string;
    details: Record<string, unknown>;
    created_at: string;
    actor_name: string;
  }[];
}
