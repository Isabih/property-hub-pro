DROP POLICY IF EXISTS "Public can view published properties" ON public.properties;
CREATE POLICY "Public can view published properties"
ON public.properties
FOR SELECT
TO anon, authenticated
USING (status = ANY (ARRAY['active'::text, 'sold'::text, 'maintenance'::text]));

DROP POLICY IF EXISTS "Owners agents and staff can view properties" ON public.properties;
CREATE POLICY "Owners agents and staff can view properties"
ON public.properties
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id
  OR auth.uid() = agent_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'it'::public.app_role)
);

DROP POLICY IF EXISTS "Public read property images" ON public.property_images;
DROP POLICY IF EXISTS "Public read published property images" ON public.property_images;
CREATE POLICY "Public read published property images"
ON public.property_images
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_images.property_id
      AND p.status = ANY (ARRAY['active'::text, 'sold'::text, 'maintenance'::text])
  )
);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;