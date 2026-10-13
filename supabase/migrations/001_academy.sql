CREATE SCHEMA IF NOT EXISTS academy;
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
  email text NOT NULL UNIQUE, display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student','trainer','admin','auditor')),
  enabled boolean NOT NULL DEFAULT true, synthetic boolean NOT NULL DEFAULT false,
  preferences jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.local_credentials (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE, password_hash text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.sessions (
  token_hash text PRIMARY KEY, profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.login_attempts (
  key text PRIMARY KEY, attempts integer NOT NULL DEFAULT 0, reset_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
  title text NOT NULL, duration integer NOT NULL DEFAULT 45, description text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
  course_id uuid NOT NULL REFERENCES courses(id), name text NOT NULL, start_date date NOT NULL,
  status text NOT NULL DEFAULT 'active'
);
CREATE TABLE IF NOT EXISTS public.trainer_assignments (
  trainer_id uuid NOT NULL REFERENCES profiles(id), cohort_id uuid NOT NULL REFERENCES cohorts(id),
  PRIMARY KEY (trainer_id,cohort_id)
);
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES profiles(id),
  cohort_id uuid NOT NULL REFERENCES cohorts(id), enrolled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active', UNIQUE(student_id,cohort_id)
);
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid NOT NULL REFERENCES courses(id),
  stage integer NOT NULL CHECK(stage BETWEEN 0 AND 14), title text NOT NULL,
  description text NOT NULL, UNIQUE(course_id,stage)
);
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), module_id uuid NOT NULL REFERENCES modules(id),
  course_id uuid NOT NULL REFERENCES courses(id), day integer NOT NULL CHECK(day BETWEEN 1 AND 45),
  title text NOT NULL, objective text NOT NULL, minutes integer NOT NULL DEFAULT 45,
  required_gate integer NOT NULL DEFAULT 0, content jsonb NOT NULL, form_key text NOT NULL,
  version integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(course_id,day)
);
CREATE TABLE IF NOT EXISTS public.instructor_notes (
  lesson_id uuid PRIMARY KEY REFERENCES lessons(id), script text NOT NULL, questions jsonb NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS public.lesson_content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lesson_id uuid NOT NULL REFERENCES lessons(id),
  position integer NOT NULL, kind text NOT NULL, classification text NOT NULL DEFAULT 'synthetic', body jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS public.checklist_responses (
  student_id uuid NOT NULL REFERENCES profiles(id), lesson_id uuid NOT NULL REFERENCES lessons(id),
  responses jsonb NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(student_id,lesson_id)
);
CREATE TABLE IF NOT EXISTS public.lesson_completions (
  student_id uuid NOT NULL REFERENCES profiles(id), lesson_id uuid NOT NULL REFERENCES lessons(id),
  approved_by uuid REFERENCES profiles(id), completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(student_id,lesson_id)
);
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
  lesson_id uuid REFERENCES lessons(id), cohort_id uuid REFERENCES cohorts(id), title text NOT NULL,
  form_key text NOT NULL, difficulty text NOT NULL, instructions text NOT NULL,
  required_evidence text NOT NULL, rubric jsonb NOT NULL, max_score integer NOT NULL DEFAULT 100,
  classification text NOT NULL DEFAULT 'synthetic', assigned_by uuid REFERENCES profiles(id), due_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES profiles(id),
  assignment_id uuid REFERENCES assignments(id), lesson_id uuid REFERENCES lessons(id),
  parent_id uuid REFERENCES submissions(id), form_key text NOT NULL, title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','changes_requested','approved','rejected')),
  data jsonb NOT NULL DEFAULT '{}', revision integer NOT NULL DEFAULT 1,
  classification text NOT NULL DEFAULT 'synthetic' CHECK(classification IN ('verified','internal','synthetic','pending')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), submitted_at timestamptz
);
CREATE INDEX IF NOT EXISTS submissions_owner ON submissions(student_id,form_key,status);
CREATE TABLE IF NOT EXISTS public.submission_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), submission_id uuid NOT NULL REFERENCES submissions(id),
  student_id uuid NOT NULL REFERENCES profiles(id), revision integer NOT NULL,
  data jsonb NOT NULL, status text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.submission_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), submission_id uuid REFERENCES submissions(id),
  student_id uuid NOT NULL REFERENCES profiles(id), filename text NOT NULL, mime_type text NOT NULL,
  size integer NOT NULL, storage_key text NOT NULL, classification text NOT NULL DEFAULT 'synthetic',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.trainer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), submission_id uuid NOT NULL REFERENCES submissions(id),
  student_id uuid NOT NULL REFERENCES profiles(id), reviewer_id uuid NOT NULL REFERENCES profiles(id),
  decision text NOT NULL CHECK(decision IN ('approved','rejected','changes_requested')), score numeric CHECK(score BETWEEN 0 AND 100),
  comments text NOT NULL, field_comments jsonb NOT NULL DEFAULT '[]', critical boolean NOT NULL DEFAULT false,
  deadline timestamptz, revision integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.product_research_records (
  id uuid PRIMARY KEY REFERENCES submissions(id), student_id uuid NOT NULL REFERENCES profiles(id),
  product_name text NOT NULL, country text, reference_url text, observed_price numeric, sold_quantity integer,
  details jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS public.product_selection_decisions (
  id uuid PRIMARY KEY REFERENCES submissions(id), student_id uuid NOT NULL REFERENCES profiles(id),
  product_id uuid REFERENCES product_research_records(id), scores jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES profiles(id),
  name text NOT NULL, source_url text NOT NULL, classification text NOT NULL DEFAULT 'pending'
);
CREATE TABLE IF NOT EXISTS public.sourcing_records (
  id uuid PRIMARY KEY REFERENCES submissions(id), student_id uuid NOT NULL REFERENCES profiles(id),
  product_id uuid NOT NULL REFERENCES product_research_records(id), supplier_id uuid REFERENCES suppliers(id),
  product_rating numeric CHECK(product_rating BETWEEN 0 AND 5), store_feedback numeric CHECK(store_feedback BETWEEN 0 AND 100),
  source_price numeric, selected_variant text, details jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS public.costing_records (
  id uuid PRIMARY KEY REFERENCES submissions(id), student_id uuid NOT NULL REFERENCES profiles(id),
  product_id uuid NOT NULL REFERENCES product_research_records(id), source_id uuid NOT NULL REFERENCES sourcing_records(id),
  inputs jsonb NOT NULL, calculation jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS public.product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES profiles(id),
  product_id uuid NOT NULL REFERENCES product_research_records(id), sku text NOT NULL, attributes jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS public.listing_drafts (
  id uuid PRIMARY KEY REFERENCES submissions(id), student_id uuid NOT NULL REFERENCES profiles(id),
  product_id uuid REFERENCES product_research_records(id), title text NOT NULL, details jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS public.simulated_orders (
  id uuid PRIMARY KEY REFERENCES submissions(id), student_id uuid NOT NULL REFERENCES profiles(id),
  product_id uuid REFERENCES product_research_records(id), details jsonb NOT NULL, synthetic boolean NOT NULL DEFAULT true CHECK(synthetic)
);
CREATE TABLE IF NOT EXISTS public.simulated_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES simulated_orders(id),
  student_id uuid NOT NULL REFERENCES profiles(id), sku text NOT NULL, quantity integer NOT NULL CHECK(quantity>0)
);
CREATE TABLE IF NOT EXISTS public.simulated_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES profiles(id),
  order_id uuid REFERENCES simulated_orders(id), occurred_at timestamptz NOT NULL, event text NOT NULL,
  synthetic boolean NOT NULL DEFAULT true CHECK(synthetic)
);
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY REFERENCES submissions(id), student_id uuid NOT NULL REFERENCES profiles(id),
  details jsonb NOT NULL, response_target_hours integer NOT NULL DEFAULT 24
);
CREATE TABLE IF NOT EXISTS public.financial_records (
  id uuid PRIMARY KEY REFERENCES submissions(id), student_id uuid NOT NULL REFERENCES profiles(id),
  product_id uuid REFERENCES product_research_records(id), inputs jsonb NOT NULL, calculation jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid NOT NULL REFERENCES courses(id), title text NOT NULL,
  gate integer NOT NULL, questions jsonb NOT NULL, pass_mark integer NOT NULL DEFAULT 80
);
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES profiles(id),
  assessment_id uuid NOT NULL REFERENCES assessments(id), answers jsonb NOT NULL, score numeric NOT NULL,
  passed boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.approvals (
  student_id uuid NOT NULL REFERENCES profiles(id), gate integer NOT NULL CHECK(gate BETWEEN 1 AND 7),
  approved_by uuid NOT NULL REFERENCES profiles(id), reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(student_id,gate)
);
CREATE TABLE IF NOT EXISTS public.certification_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL UNIQUE REFERENCES profiles(id),
  approved_by uuid NOT NULL REFERENCES profiles(id), score numeric NOT NULL, status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.attendance (
  student_id uuid NOT NULL REFERENCES profiles(id), lesson_id uuid NOT NULL REFERENCES lessons(id),
  trainer_id uuid NOT NULL REFERENCES profiles(id), present boolean NOT NULL, PRIMARY KEY(student_id,lesson_id)
);
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL, message text NOT NULL, submission_id uuid REFERENCES submissions(id),
  read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES profiles(id),
  student_id uuid REFERENCES profiles(id), action text NOT NULL, entity_id uuid,
  details jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.training_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
  title text NOT NULL, kind text NOT NULL, url text, classification text NOT NULL, description text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
  lesson_id uuid REFERENCES lessons(id), editor_id uuid NOT NULL REFERENCES profiles(id),
  content jsonb NOT NULL, version integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES profiles(id),
  recorded_by uuid NOT NULL REFERENCES profiles(id), amount numeric NOT NULL CHECK(amount>=0),
  currency text NOT NULL DEFAULT 'PKR', verified boolean NOT NULL DEFAULT false,
  reference text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION academy.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(COALESCE(NULLIF(current_setting('request.jwt.claim.sub',true),''),
    NULLIF(current_setting('request.jwt.claims',true),'')::jsonb->>'sub'),'')::uuid
$$;
CREATE OR REPLACE FUNCTION academy.role() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT role FROM profiles WHERE id=academy.uid() AND enabled
$$;
CREATE OR REPLACE FUNCTION academy.org() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT organization_id FROM profiles WHERE id=academy.uid() AND enabled
$$;
CREATE OR REPLACE FUNCTION academy.can_read_student(target uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT EXISTS(SELECT 1 FROM profiles p WHERE p.id=target AND p.organization_id=academy.org() AND
    (target=academy.uid() OR academy.role()='admin' OR
      (academy.role() IN ('trainer','auditor') AND EXISTS(SELECT 1 FROM enrollments e JOIN trainer_assignments t ON t.cohort_id=e.cohort_id WHERE e.student_id=target AND t.trainer_id=academy.uid()))))
$$;
CREATE OR REPLACE FUNCTION academy.can_read_cohort(target uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT EXISTS(SELECT 1 FROM cohorts c WHERE c.id=target AND c.organization_id=academy.org() AND
    (academy.role()='admin' OR EXISTS(SELECT 1 FROM enrollments e WHERE e.cohort_id=target AND e.student_id=academy.uid()) OR
     EXISTS(SELECT 1 FROM trainer_assignments t WHERE t.cohort_id=target AND t.trainer_id=academy.uid())))
$$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; END $$;
GRANT USAGE ON SCHEMA public,academy TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA academy TO authenticated;
-- Database clients can read permitted records. All writes go through the authorized server API.
-- No credentials or sessions are granted to the authenticated client role.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['checklist_responses','lesson_completions','submissions','submission_versions','submission_evidence','trainer_feedback','product_research_records','product_selection_decisions','suppliers','sourcing_records','costing_records','product_variations','listing_drafts','simulated_orders','simulated_order_items','simulated_tracking_events','support_tickets','financial_records','assessment_attempts','approvals','certification_records','attendance','payment_records'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('DROP POLICY IF EXISTS scope_read ON %I',t);
    EXECUTE format('CREATE POLICY scope_read ON %I FOR SELECT TO authenticated USING (academy.can_read_student(student_id))',t);
    EXECUTE format('GRANT SELECT ON %I TO authenticated',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['organizations','profiles','courses','cohorts','trainer_assignments','enrollments','modules','lessons','instructor_notes','lesson_content_blocks','assignments','assessments','notifications','audit_logs','training_assets','document_versions','local_credentials','sessions','login_attempts'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
  END LOOP;
END $$;
DROP POLICY IF EXISTS scope_read ON profiles;
CREATE POLICY scope_read ON profiles FOR SELECT TO authenticated USING(id=academy.uid() OR academy.can_read_student(id));
DROP POLICY IF EXISTS scope_read ON cohorts;
CREATE POLICY scope_read ON cohorts FOR SELECT TO authenticated USING(academy.can_read_cohort(id));
DROP POLICY IF EXISTS scope_read ON enrollments;
CREATE POLICY scope_read ON enrollments FOR SELECT TO authenticated USING(academy.can_read_student(student_id));
DROP POLICY IF EXISTS scope_read ON trainer_assignments;
CREATE POLICY scope_read ON trainer_assignments FOR SELECT TO authenticated USING(academy.can_read_cohort(cohort_id));
DROP POLICY IF EXISTS scope_read ON organizations;
CREATE POLICY scope_read ON organizations FOR SELECT TO authenticated USING(id=academy.org());
DROP POLICY IF EXISTS scope_read ON courses;
CREATE POLICY scope_read ON courses FOR SELECT TO authenticated USING(organization_id=academy.org());
DROP POLICY IF EXISTS scope_read ON modules;
CREATE POLICY scope_read ON modules FOR SELECT TO authenticated USING(course_id IN (SELECT id FROM courses));
DROP POLICY IF EXISTS scope_read ON lessons;
CREATE POLICY scope_read ON lessons FOR SELECT TO authenticated USING(course_id IN (SELECT id FROM courses));
DROP POLICY IF EXISTS scope_read ON instructor_notes;
CREATE POLICY scope_read ON instructor_notes FOR SELECT TO authenticated USING(academy.role() IN ('admin','trainer') AND lesson_id IN(SELECT id FROM lessons));
DROP POLICY IF EXISTS scope_read ON lesson_content_blocks;
CREATE POLICY scope_read ON lesson_content_blocks FOR SELECT TO authenticated USING(lesson_id IN(SELECT id FROM lessons));
DROP POLICY IF EXISTS scope_read ON assignments;
CREATE POLICY scope_read ON assignments FOR SELECT TO authenticated USING(organization_id=academy.org() AND (cohort_id IS NULL OR academy.can_read_cohort(cohort_id)));
DROP POLICY IF EXISTS scope_read ON assessments;
CREATE POLICY scope_read ON assessments FOR SELECT TO authenticated USING(false);
DROP POLICY IF EXISTS scope_read ON notifications;
CREATE POLICY scope_read ON notifications FOR SELECT TO authenticated USING(user_id=academy.uid());
DROP POLICY IF EXISTS scope_read ON audit_logs;
CREATE POLICY scope_read ON audit_logs FOR SELECT TO authenticated USING(academy.role()='admin' OR actor_id=academy.uid() OR academy.can_read_student(student_id));
DROP POLICY IF EXISTS scope_read ON training_assets;
CREATE POLICY scope_read ON training_assets FOR SELECT TO authenticated USING(organization_id=academy.org());
DROP POLICY IF EXISTS scope_read ON document_versions;
CREATE POLICY scope_read ON document_versions FOR SELECT TO authenticated USING(organization_id=academy.org() AND academy.role()='admin');
GRANT SELECT ON organizations,profiles,courses,cohorts,trainer_assignments,enrollments,modules,lessons,instructor_notes,lesson_content_blocks,assignments,notifications,audit_logs,training_assets,document_versions TO authenticated;
