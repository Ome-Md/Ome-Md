-- Run after 001_academy.sql in a Supabase project.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('academy-evidence','academy-evidence',false,10485760,ARRAY['image/png','image/jpeg','image/webp','application/pdf','text/plain']),
       ('academy-branding','academy-branding',true,5242880,ARRAY['image/png','image/jpeg','image/webp']),
       ('academy-resources','academy-resources',false,10485760,ARRAY['image/png','image/jpeg','image/webp','application/pdf','text/plain'])
ON CONFLICT(id) DO NOTHING;
DROP POLICY IF EXISTS academy_evidence_read ON storage.objects;
CREATE POLICY academy_evidence_read ON storage.objects FOR SELECT TO authenticated
USING(bucket_id='academy-evidence' AND academy.can_read_student((storage.foldername(name))[1]::uuid));
DROP POLICY IF EXISTS academy_evidence_insert ON storage.objects;
CREATE POLICY academy_evidence_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK(bucket_id='academy-evidence' AND (storage.foldername(name))[1]=auth.uid()::text);
DROP POLICY IF EXISTS academy_branding_manage ON storage.objects;
CREATE POLICY academy_branding_manage ON storage.objects FOR INSERT TO authenticated
WITH CHECK(bucket_id='academy-branding' AND academy.role()='admin' AND (storage.foldername(name))[1]=academy.org()::text);
DROP POLICY IF EXISTS academy_resources_read ON storage.objects;
CREATE POLICY academy_resources_read ON storage.objects FOR SELECT TO authenticated
USING(bucket_id='academy-resources' AND (storage.foldername(name))[1]=academy.org()::text);
DROP POLICY IF EXISTS academy_resources_manage ON storage.objects;
CREATE POLICY academy_resources_manage ON storage.objects FOR INSERT TO authenticated
WITH CHECK(bucket_id='academy-resources' AND academy.role()='admin' AND (storage.foldername(name))[1]=academy.org()::text);
