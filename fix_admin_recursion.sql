-- fix_admin_recursion.sql

-- 🛑 PROBLEM: The previous policy caused an "Infinite Loop" (Recursion) because checking if you are an admin required reading the users table, which required checking if you are an admin... resulting in Error 500.

-- ✅ SOLUTION: Use a "Security Definer" function to check admin status safely.

-- 1. Create safe function
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER -- Bypasses RLS for this specific check
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

-- 2. Drop the crashing policies
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can read all data" ON public.users;

-- 3. Re-create safe policies
CREATE POLICY "Admins can read all users" ON public.users 
FOR SELECT USING (
  check_is_admin() = true
);

-- 4. Ensure users can still read their own profile
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" ON public.users 
FOR SELECT USING (
  auth.uid() = id
);
