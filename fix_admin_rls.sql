-- fix_admin_rls.sql

-- 1. Enable RLS on users table (best practice)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to read their OWN data (Critical for is_admin check)
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" ON public.users 
FOR SELECT USING (
  auth.uid() = id
);

-- 3. Allow Admins to read ALL users (Critical for User Management list)
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users" ON public.users 
FOR SELECT USING (
  (SELECT is_admin FROM public.users WHERE id = auth.uid()) = TRUE
);

-- 4. Ensure your user is definitely an admin
UPDATE public.users 
SET is_admin = true 
WHERE email = 'admin@dataleash.io';
