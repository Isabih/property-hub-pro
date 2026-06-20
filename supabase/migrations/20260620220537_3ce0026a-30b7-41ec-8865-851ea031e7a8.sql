
-- Properties core table
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  property_type text NOT NULL DEFAULT 'residential',
  listing_type text NOT NULL DEFAULT 'sale', -- sale | rent
  status text NOT NULL DEFAULT 'draft', -- draft | active | sold | rented | archived
  price numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  area_sqm numeric(10,2),
  address text,
  city text,
  district text,
  country text DEFAULT 'Rwanda',
  lat double precision,
  lng double precision,
  amenities text[] DEFAULT '{}',
  featured boolean NOT NULL DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active properties"
  ON public.properties FOR SELECT TO anon, authenticated
  USING (status = 'active' OR auth.uid() = owner_id OR auth.uid() = agent_id
         OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'));

CREATE POLICY "Owners insert their properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners/agents/admin update"
  ON public.properties FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = agent_id
         OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'))
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = agent_id
         OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'));

CREATE POLICY "Owners/admin delete"
  ON public.properties FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_properties_updated
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_properties_owner ON public.properties(owner_id);
CREATE INDEX idx_properties_agent ON public.properties(agent_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_city ON public.properties(city);

-- Property images
CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  position integer NOT NULL DEFAULT 0,
  is_cover boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.property_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO authenticated;
GRANT ALL ON public.property_images TO service_role;

ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read property images"
  ON public.property_images FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Owners manage their property images"
  ON public.property_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p
                 WHERE p.id = property_id
                 AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid()
                      OR public.has_role(auth.uid(), 'admin')
                      OR public.has_role(auth.uid(), 'it'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p
                 WHERE p.id = property_id
                 AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid()
                      OR public.has_role(auth.uid(), 'admin')
                      OR public.has_role(auth.uid(), 'it'))));

CREATE INDEX idx_property_images_property ON public.property_images(property_id);

-- Inquiries / visits
CREATE TABLE public.property_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text,
  email text,
  phone text,
  message text,
  status text NOT NULL DEFAULT 'new', -- new | contacted | scheduled | closed
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_inquiries TO authenticated;
GRANT INSERT ON public.property_inquiries TO anon;
GRANT ALL ON public.property_inquiries TO service_role;

ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create inquiry"
  ON public.property_inquiries FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Inquirers and property staff view"
  ON public.property_inquiries FOR SELECT TO authenticated
  USING (user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
                    AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid()))
         OR public.has_role(auth.uid(), 'admin')
         OR public.has_role(auth.uid(), 'it'));

CREATE POLICY "Staff update inquiry"
  ON public.property_inquiries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
                 AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid()))
         OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (true);

CREATE TRIGGER trg_inquiries_updated
  BEFORE UPDATE ON public.property_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_inquiries_property ON public.property_inquiries(property_id);
CREATE INDEX idx_inquiries_user ON public.property_inquiries(user_id);

-- Saved properties (wishlist)
CREATE TABLE public.saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

GRANT SELECT, INSERT, DELETE ON public.saved_properties TO authenticated;
GRANT ALL ON public.saved_properties TO service_role;

ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their saves"
  ON public.saved_properties FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Property views (analytics)
CREATE TABLE public.property_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.property_views TO authenticated;
GRANT INSERT ON public.property_views TO anon;
GRANT ALL ON public.property_views TO service_role;

ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone log a view"
  ON public.property_views FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Staff view views"
  ON public.property_views FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
                 AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid()))
         OR public.has_role(auth.uid(), 'admin')
         OR public.has_role(auth.uid(), 'it'));

CREATE INDEX idx_views_property ON public.property_views(property_id);
CREATE INDEX idx_views_date ON public.property_views(viewed_at);
