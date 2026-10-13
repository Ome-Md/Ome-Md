CREATE OR REPLACE FUNCTION academy.current_gate() RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(min(expected.gate_number)-1,7) FROM generate_series(1,7) AS expected(gate_number) WHERE NOT EXISTS(SELECT 1 FROM approvals a WHERE a.student_id=academy.uid() AND a.gate=expected.gate_number)
$$;
GRANT EXECUTE ON FUNCTION academy.current_gate() TO authenticated;
DROP POLICY IF EXISTS scope_read ON lessons;
CREATE POLICY scope_read ON lessons FOR SELECT TO authenticated USING(course_id IN(SELECT id FROM courses) AND
 (academy.role() IN('trainer','admin','auditor') OR required_gate<=academy.current_gate()));
