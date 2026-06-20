DROP POLICY IF EXISTS "Public can view active properties" ON public.properties;
CREATE POLICY "Public can view published properties"
ON public.properties FOR SELECT
USING (
  status IN ('active','sold','maintenance')
  OR auth.uid() = owner_id
  OR auth.uid() = agent_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'it'::app_role)
);