INSERT INTO public.user_roles (user_id, role)
SELECT id, 'it'::public.app_role FROM auth.users WHERE email = 'ksabih33@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;