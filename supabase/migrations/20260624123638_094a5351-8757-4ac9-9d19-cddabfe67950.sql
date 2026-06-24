
CREATE TABLE public.pending_staff (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password text not null,
  full_name text not null,
  phone text,
  role public.app_role not null,
  avatar_url text,
  otp_hash text not null,
  otp_expires_at timestamptz not null,
  otp_attempts int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
GRANT ALL ON public.pending_staff TO service_role;
ALTER TABLE public.pending_staff ENABLE ROW LEVEL SECURITY;
