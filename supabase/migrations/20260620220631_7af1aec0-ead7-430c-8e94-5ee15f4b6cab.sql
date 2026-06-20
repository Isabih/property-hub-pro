
CREATE POLICY "Public read property media"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-media');

CREATE POLICY "Auth upload property media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Auth update property media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-media' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'property-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Auth delete property media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-media' AND (storage.foldername(name))[1] = auth.uid()::text);
