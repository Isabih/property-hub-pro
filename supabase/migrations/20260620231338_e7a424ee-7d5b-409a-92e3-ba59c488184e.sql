
-- 1. Section column on property_images
ALTER TABLE public.property_images
  ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'main';

ALTER TABLE public.property_images
  DROP CONSTRAINT IF EXISTS property_images_section_check;
ALTER TABLE public.property_images
  ADD CONSTRAINT property_images_section_check
  CHECK (section IN ('main','kitchen','living_room','bathroom','gym'));

-- 2. Tighten public read on property_images to published properties only
DROP POLICY IF EXISTS "Public read property images" ON public.property_images;
CREATE POLICY "Public read property images"
  ON public.property_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_images.property_id
        AND (
          p.status IN ('active','sold','maintenance')
          OR p.owner_id = auth.uid()
          OR p.agent_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'it')
        )
    )
  );

-- 3. Staff notifications table
CREATE TABLE IF NOT EXISTS public.staff_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_notifications_recipient
  ON public.staff_notifications(recipient_id, read_at, created_at DESC);

GRANT SELECT, UPDATE ON public.staff_notifications TO authenticated;
GRANT ALL ON public.staff_notifications TO service_role;

ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recipients read own notifications" ON public.staff_notifications;
CREATE POLICY "Recipients read own notifications"
  ON public.staff_notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Recipients mark own notifications read" ON public.staff_notifications;
CREATE POLICY "Recipients mark own notifications read"
  ON public.staff_notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- 4. Notify trigger
CREATE OR REPLACE FUNCTION public.notify_staff_on_property_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text;
  v_title text;
  v_body text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('active','sold','maintenance') THEN
      RETURN NEW;
    END IF;
    v_kind := 'property_published';
    v_title := 'New property published: ' || NEW.title;
    v_body := 'A new property has been added with status ' || NEW.status || '.';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = OLD.status THEN
      RETURN NEW;
    END IF;
    IF NEW.status = 'active' THEN
      v_kind := 'property_approved';
      v_title := 'Property approved: ' || NEW.title;
      v_body := 'Listing is now live on the website.';
    ELSIF NEW.status = 'sold' THEN
      v_kind := 'property_sold';
      v_title := 'Property marked SOLD: ' || NEW.title;
      v_body := 'Status was changed from ' || OLD.status || ' to sold.';
    ELSIF NEW.status = 'maintenance' THEN
      v_kind := 'property_maintenance';
      v_title := 'Property under MAINTENANCE: ' || NEW.title;
      v_body := 'Status was changed from ' || OLD.status || ' to maintenance.';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.staff_notifications (recipient_id, property_id, kind, title, body)
  SELECT ur.user_id, NEW.id, v_kind, v_title, v_body
  FROM public.user_roles ur
  WHERE ur.role IN ('it','admin');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_staff_property ON public.properties;
CREATE TRIGGER trg_notify_staff_property
AFTER INSERT OR UPDATE OF status ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_on_property_change();
