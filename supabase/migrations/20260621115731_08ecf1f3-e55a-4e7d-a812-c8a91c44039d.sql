CREATE TYPE public.service_request_status AS ENUM ('pending','in_progress','completed','cancelled');
CREATE TYPE public.service_request_priority AS ENUM ('low','medium','high','urgent');
CREATE TYPE public.service_request_category AS ENUM ('maintenance','plumbing','electrical','cleaning','security','general','other');

CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category public.service_request_category NOT NULL DEFAULT 'general',
  priority public.service_request_priority NOT NULL DEFAULT 'medium',
  status public.service_request_status NOT NULL DEFAULT 'pending',
  image_urls text[] NOT NULL DEFAULT '{}',
  admin_response text,
  responded_at timestamptz,
  responded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer reads own requests" ON public.service_requests FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    JOIN auth.users u ON lower(u.email) = lower(c.email)
    WHERE c.id = service_requests.customer_id AND u.id = auth.uid()
  )
);

CREATE POLICY "staff reads all requests" ON public.service_requests FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'it')
  OR public.has_role(auth.uid(),'receptionist') OR public.has_role(auth.uid(),'agent')
);

CREATE POLICY "customer creates own" ON public.service_requests FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers c
    JOIN auth.users u ON lower(u.email) = lower(c.email)
    WHERE c.id = customer_id AND u.id = auth.uid()
  )
);

CREATE POLICY "staff updates" ON public.service_requests FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'it') OR public.has_role(auth.uid(),'receptionist')
);

CREATE TRIGGER trg_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.notify_on_service_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_customer record;
  v_kind text;
  v_title text;
BEGIN
  SELECT c.* INTO v_customer FROM public.customers c WHERE c.id = NEW.customer_id;
  v_kind := CASE WHEN NEW.priority = 'urgent' THEN 'service_urgent' ELSE 'service_request' END;
  v_title := CASE WHEN NEW.priority = 'urgent' THEN 'URGENT service request: ' ELSE 'New service request: ' END || NEW.title;

  IF v_customer.created_by IS NOT NULL THEN
    INSERT INTO public.staff_notifications (recipient_id, kind, title, body)
    VALUES (v_customer.created_by, v_kind, v_title,
      v_customer.full_name || ' (' || NEW.category || ', ' || NEW.priority || '): ' || NEW.description);
  END IF;

  INSERT INTO public.staff_notifications (recipient_id, kind, title, body)
  SELECT ur.user_id, v_kind, v_title,
    v_customer.full_name || ' (' || NEW.category || ', ' || NEW.priority || '): ' || NEW.description
  FROM public.user_roles ur
  WHERE ur.role IN ('admin','it')
    AND (v_customer.created_by IS NULL OR ur.user_id <> v_customer.created_by);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_service_request
AFTER INSERT ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_service_request();