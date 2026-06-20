
-- Properties: restrict INSERT to IT/admin
DROP POLICY IF EXISTS "Owners insert their properties" ON public.properties;
CREATE POLICY "Staff insert properties"
ON public.properties FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'it'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Properties: restrict DELETE to IT/admin
DROP POLICY IF EXISTS "Owners/admin delete" ON public.properties;
CREATE POLICY "Staff delete properties"
ON public.properties FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'it'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Storage: restrict property-media writes to IT/admin staff
DROP POLICY IF EXISTS "Auth upload property media" ON storage.objects;
DROP POLICY IF EXISTS "Auth update property media" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete property media" ON storage.objects;

CREATE POLICY "Staff upload property media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-media'
  AND (has_role(auth.uid(), 'it'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Staff update property media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'property-media'
  AND (has_role(auth.uid(), 'it'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  bucket_id = 'property-media'
  AND (has_role(auth.uid(), 'it'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Staff delete property media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'property-media'
  AND (has_role(auth.uid(), 'it'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);
