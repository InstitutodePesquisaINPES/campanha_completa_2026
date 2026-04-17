
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth read documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documentos');

CREATE POLICY "Auth upload documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Auth delete documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documentos');
