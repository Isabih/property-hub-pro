
DROP POLICY "Anyone can create inquiry" ON public.property_inquiries;
CREATE POLICY "Anyone can create inquiry"
  ON public.property_inquiries FOR INSERT TO anon, authenticated
  WITH CHECK (property_id IS NOT NULL
              AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id));

DROP POLICY "Staff update inquiry" ON public.property_inquiries;
CREATE POLICY "Staff update inquiry"
  ON public.property_inquiries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
                 AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid()))
         OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
                 AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid()))
         OR public.has_role(auth.uid(), 'admin'));

DROP POLICY "Anyone log a view" ON public.property_views;
CREATE POLICY "Anyone log a view"
  ON public.property_views FOR INSERT TO anon, authenticated
  WITH CHECK (property_id IS NOT NULL
              AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id));
