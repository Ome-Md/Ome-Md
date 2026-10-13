CREATE TABLE IF NOT EXISTS public.lesson_notes (
 user_id uuid NOT NULL REFERENCES profiles(id), lesson_id uuid NOT NULL REFERENCES lessons(id),
 notes text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,lesson_id)
);
ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_notes ON lesson_notes FOR SELECT TO authenticated USING(user_id=academy.uid());
GRANT SELECT ON lesson_notes TO authenticated;
