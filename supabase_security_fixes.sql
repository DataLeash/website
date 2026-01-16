-- Enable RLS on all identified tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_shards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Users Table Policies
CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- 2. Files Table Policies
CREATE POLICY "Users can view their own files"
ON public.files FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own files"
ON public.files FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own files"
ON public.files FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own files"
ON public.files FOR DELETE
USING (auth.uid() = owner_id);

-- 3. Permissions Table Policies
-- Allow file owners to manage permissions, and viewers to see their own permissions
CREATE POLICY "Users can view permissions for their files or themselves"
ON public.permissions FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.files 
    WHERE files.id = permissions.file_id 
    AND files.owner_id = auth.uid()
  )
);

CREATE POLICY "File owners can insert permissions"
ON public.permissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.files 
    WHERE files.id = permissions.file_id 
    AND files.owner_id = auth.uid()
  )
);

CREATE POLICY "File owners can update permissions"
ON public.permissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.files 
    WHERE files.id = permissions.file_id 
    AND files.owner_id = auth.uid()
  )
);

CREATE POLICY "File owners can delete permissions"
ON public.permissions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.files 
    WHERE files.id = permissions.file_id 
    AND files.owner_id = auth.uid()
  )
);

-- 4. Key Shards
-- Strictly limit to Service Role (backend) for now, as direct client access is dangerous for keys.
-- If client needs access, backend should proxy it or signed URL.
-- Note: Service Role bypasses RLS, so 'false' effectively blocks Anon/Authenticated public access.
CREATE POLICY "No public access to key shards"
ON public.key_shards
USING (false);

-- 5. Access Logs
-- File owners can see logs for their files. Viewers can see logs they created?
CREATE POLICY "File owners can view logs"
ON public.access_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.files 
    WHERE files.id = access_logs.file_id 
    AND files.owner_id = auth.uid()
  )
);

-- Allow inserting logs if you are the user identified in the log (or backend)
CREATE POLICY "Users can create access logs"
ON public.access_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 6. Notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update/read their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Fix for access_tokens if it exists/user created it
-- Assuming it's a public table for API tokens
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'access_tokens') THEN
        ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view own access tokens" ON public.access_tokens FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own access tokens" ON public.access_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can delete own access tokens" ON public.access_tokens FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;
