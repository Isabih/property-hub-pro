
CREATE TABLE IF NOT EXISTS public.app_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  sender_name text NOT NULL DEFAULT 'Novaworks',
  from_email text NOT NULL DEFAULT 'no-reply@novaworks.rw',
  reply_to text,
  signature text NOT NULL DEFAULT E'Regards,\nNovaworks Team',
  brand_color text NOT NULL DEFAULT '#0f766e',
  site_url text NOT NULL DEFAULT 'https://novaworks.rw',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read app_settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'it') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'receptionist'));
CREATE POLICY "IT can insert app_settings" ON public.app_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'it'));
CREATE POLICY "IT can update app_settings" ON public.app_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'it'))
  WITH CHECK (public.has_role(auth.uid(),'it'));
INSERT INTO public.app_settings(id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  apartment_no text,
  agent_id uuid,
  stay_start date,
  stay_end date,
  amount_paid numeric(12,2) DEFAULT 0,
  payment_method text,
  payment_status text NOT NULL DEFAULT 'pending',
  email_verified boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage customers" ON public.customers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'receptionist') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'it'))
  WITH CHECK (public.has_role(auth.uid(),'receptionist') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'it'));
CREATE POLICY "Agent can read own customers" ON public.customers
  FOR SELECT TO authenticated USING (agent_id = auth.uid());
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  verified boolean NOT NULL DEFAULT false,
  notify boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscribers TO authenticated;
GRANT INSERT ON public.subscribers TO anon;
GRANT ALL ON public.subscribers TO service_role;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff read subscribers" ON public.subscribers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'it') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'receptionist'));
CREATE POLICY "Staff update subscribers" ON public.subscribers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'it') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'it') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read email_log" ON public.email_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'it') OR public.has_role(auth.uid(),'admin'));

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS notify_subscribers boolean NOT NULL DEFAULT false;
