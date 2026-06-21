
-- =====================================================================
-- 1) properties: add media + apartments + luxury flag
-- =====================================================================
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS tour_3d_url TEXT,
  ADD COLUMN IF NOT EXISTS blueprint_url TEXT,
  ADD COLUMN IF NOT EXISTS unit_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_luxury BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unit_code_prefix TEXT;

-- =====================================================================
-- 2) profiles: deactivation flag
-- =====================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- =====================================================================
-- 3) apartments
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT,
  floor INTEGER,
  bedrooms INTEGER,
  status TEXT NOT NULL DEFAULT 'available', -- available | occupied | maintenance | reserved
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, code)
);

GRANT SELECT ON public.apartments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apartments TO authenticated;
GRANT ALL ON public.apartments TO service_role;

ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "apartments_public_read"
  ON public.apartments FOR SELECT
  USING (true);

CREATE POLICY "apartments_staff_write"
  ON public.apartments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'receptionist'))
  WITH CHECK (public.has_role(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'receptionist'));

CREATE TRIGGER apartments_touch BEFORE UPDATE ON public.apartments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS apartments_property_idx ON public.apartments(property_id);
CREATE INDEX IF NOT EXISTS apartments_status_idx ON public.apartments(status);

-- =====================================================================
-- 4) luxury_access_requests
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.luxury_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  reason TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  otp_hash TEXT,
  otp_expires_at TIMESTAMPTZ,
  otp_attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | denied
  access_token TEXT, -- issued on approval
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.luxury_access_requests TO authenticated;
GRANT ALL ON public.luxury_access_requests TO service_role;

ALTER TABLE public.luxury_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "luxury_staff_read"
  ON public.luxury_access_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "luxury_staff_update"
  ON public.luxury_access_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin'));

-- Inserts and email-verification updates run server-side via service role; no anon policy needed.

CREATE TRIGGER luxury_touch BEFORE UPDATE ON public.luxury_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS luxury_email_idx ON public.luxury_access_requests(email);
CREATE INDEX IF NOT EXISTS luxury_status_idx ON public.luxury_access_requests(status);
CREATE INDEX IF NOT EXISTS luxury_token_idx ON public.luxury_access_requests(access_token);

-- =====================================================================
-- 5) password_reset_requests
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  otp_hash TEXT,                -- email-verification code (step 1)
  otp_expires_at TIMESTAMPTZ,
  otp_attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | verified | approved | used | denied
  temp_password_hash TEXT,      -- one-time password set by IT (step 3)
  temp_password_expires_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_reset_requests TO authenticated;
GRANT ALL ON public.password_reset_requests TO service_role;

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pwreset_staff_read"
  ON public.password_reset_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "pwreset_staff_update"
  ON public.password_reset_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'it') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER pwreset_touch BEFORE UPDATE ON public.password_reset_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS pwreset_email_idx ON public.password_reset_requests(email);
CREATE INDEX IF NOT EXISTS pwreset_status_idx ON public.password_reset_requests(status);
