CREATE TABLE IF NOT EXISTS public.branding_assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 storage_key text NOT NULL, filename text NOT NULL, mime_type text NOT NULL, size integer NOT NULL
);
ALTER TABLE branding_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assets ADD COLUMN IF NOT EXISTS storage_key text;
ALTER TABLE training_assets ADD COLUMN IF NOT EXISTS mime_type text;
ALTER TABLE training_assets ADD COLUMN IF NOT EXISTS size integer;
DROP POLICY IF EXISTS scope_read ON courses;
CREATE POLICY scope_read ON courses FOR SELECT TO authenticated USING(organization_id=academy.org() AND
 (academy.role()='admin' OR EXISTS(SELECT 1 FROM cohorts c WHERE c.course_id=courses.id AND academy.can_read_cohort(c.id))));
DROP POLICY IF EXISTS scope_read ON lessons;
CREATE POLICY scope_read ON lessons FOR SELECT TO authenticated USING(course_id IN(SELECT id FROM courses) AND
 (academy.role() IN('trainer','admin','auditor') OR required_gate<=COALESCE((SELECT max(gate) FROM approvals WHERE student_id=academy.uid()),0)));
