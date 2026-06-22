
CREATE TABLE public.property_of_the_day (
  id INTEGER PRIMARY KEY DEFAULT 1,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT singleton_pod CHECK (id = 1)
);

GRANT SELECT ON public.property_of_the_day TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_of_the_day TO authenticated;
GRANT ALL ON public.property_of_the_day TO service_role;

ALTER TABLE public.property_of_the_day ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read property of the day"
  ON public.property_of_the_day FOR SELECT
  USING (true);

CREATE POLICY "IT and admin can manage property of the day"
  ON public.property_of_the_day FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin'));

INSERT INTO public.property_of_the_day (id) VALUES (1) ON CONFLICT DO NOTHING;
