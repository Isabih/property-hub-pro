CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  apartment_id uuid REFERENCES public.apartments(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  nights integer NOT NULL DEFAULT 1,
  nightly_rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'RWF',
  payment_method text NOT NULL DEFAULT 'momo',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_reference text,
  gateway_tx_id text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  confirmed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at timestamptz,
  stay_start timestamptz,
  stay_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bookings_user_idx ON public.bookings(user_id);
CREATE INDEX bookings_status_idx ON public.bookings(status);
CREATE UNIQUE INDEX bookings_payment_reference_idx ON public.bookings(payment_reference) WHERE payment_reference IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Customers create own bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff view all bookings" ON public.bookings
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'receptionist') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it')
  );

CREATE POLICY "Staff manage bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'receptionist') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it')
  ) WITH CHECK (
    public.has_role(auth.uid(), 'receptionist') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it')
  );

CREATE TRIGGER bookings_touch BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();