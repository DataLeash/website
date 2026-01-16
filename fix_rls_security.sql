-- DataLeash RLS Security Fixes
-- Run this in Supabase SQL Editor to fix the 55 security issues
-- This replaces the overly permissive RLS policies with proper ones

-- =====================================================
-- 1. FIX: access_requests table
-- =====================================================
DROP POLICY IF EXISTS "All operations on access_requests" ON public.access_requests;
DROP POLICY IF EXISTS "Users can view their own access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Users can create access requests" ON public.access_requests;

-- Allow file owners to view access requests for their files
CREATE POLICY "Owners can view access requests for their files"
ON public.access_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.files 
        WHERE files.id = access_requests.file_id 
        AND files.owner_id = auth.uid()
    )
);

-- Allow anyone to create access requests (they're requesting access)
CREATE POLICY "Anyone can create access requests"
ON public.access_requests FOR INSERT
WITH CHECK (true);

-- Allow file owners to update (approve/deny) requests
CREATE POLICY "Owners can update access requests"
ON public.access_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.files 
        WHERE files.id = access_requests.file_id 
        AND files.owner_id = auth.uid()
    )
);

-- =====================================================
-- 2. FIX: access_tokens table  
-- =====================================================
DROP POLICY IF EXISTS "All operations on access_tokens" ON public.access_tokens;
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.access_tokens;
DROP POLICY IF EXISTS "Users can create tokens" ON public.access_tokens;
DROP POLICY IF EXISTS "Users can delete their tokens" ON public.access_tokens;

-- Owners can view tokens for their files
CREATE POLICY "Owners can view tokens for their files"
ON public.access_tokens FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.files 
        WHERE files.id = access_tokens.file_id 
        AND files.owner_id = auth.uid()
    )
);

-- Owners can create tokens for their files
CREATE POLICY "Owners can create tokens for their files"
ON public.access_tokens FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.files 
        WHERE files.id = access_tokens.file_id 
        AND files.owner_id = auth.uid()
    )
);

-- Owners can delete tokens for their files
CREATE POLICY "Owners can delete tokens for their files"
ON public.access_tokens FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.files 
        WHERE files.id = access_tokens.file_id 
        AND files.owner_id = auth.uid()
    )
);

-- =====================================================
-- 3. FIX: otp_codes table
-- =====================================================
DROP POLICY IF EXISTS "All operations on otp_codes" ON public.otp_codes;
DROP POLICY IF EXISTS "Service role full access" ON public.otp_codes;

-- OTP codes should only be accessible via service role (backend only)
-- No user-facing policies needed - handled by API routes with service role
CREATE POLICY "Service role only for otp_codes"
ON public.otp_codes FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- 4. FIX: sessions table
-- =====================================================
DROP POLICY IF EXISTS "All operations on sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON public.sessions FOR SELECT
USING (user_id = auth.uid());

-- Users can delete their own sessions (logout)
CREATE POLICY "Users can delete own sessions"
ON public.sessions FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- 5. FIX: suspected_leakers table
-- =====================================================
DROP POLICY IF EXISTS "All operations on suspected_leakers" ON public.suspected_leakers;

-- Only file owners can view suspected leakers for their files
CREATE POLICY "Owners can view suspected leakers"
ON public.suspected_leakers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.files 
        WHERE files.id = suspected_leakers.file_id 
        AND files.owner_id = auth.uid()
    )
);

-- Only file owners can manage suspected leakers
CREATE POLICY "Owners can manage suspected leakers"
ON public.suspected_leakers FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.files 
        WHERE files.id = suspected_leakers.file_id 
        AND files.owner_id = auth.uid()
    )
);

-- =====================================================
-- 6. FIX: access_logs table (add missing policies)
-- =====================================================
-- Enable RLS if not already
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view access logs" ON public.access_logs;

-- File owners can view access logs for their files
CREATE POLICY "Owners can view access logs for their files"
ON public.access_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.files 
        WHERE files.id = access_logs.file_id 
        AND files.owner_id = auth.uid()
    )
);

-- Service role can insert logs (from API routes)
CREATE POLICY "Service role can insert access logs"
ON public.access_logs FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR user_id = auth.uid());

-- =====================================================
-- 7. FIX: files table (add missing policies)
-- =====================================================
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage their files" ON public.files;
DROP POLICY IF EXISTS "Users can view own files" ON public.files;

-- Users can view their own files
CREATE POLICY "Users can view own files"
ON public.files FOR SELECT
USING (owner_id = auth.uid());

-- Users can create files
CREATE POLICY "Users can create files"
ON public.files FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Users can update their own files
CREATE POLICY "Users can update own files"
ON public.files FOR UPDATE
USING (owner_id = auth.uid());

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
ON public.files FOR DELETE
USING (owner_id = auth.uid());

-- =====================================================
-- 8. FIX: key_shards table (add missing policies)
-- =====================================================
ALTER TABLE public.key_shards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage key shards" ON public.key_shards;

-- Only service role should access key shards (security critical)
CREATE POLICY "Service role only for key_shards"
ON public.key_shards FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- 9. FIX: notifications table (add missing policies)
-- =====================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR user_id = auth.uid());

-- =====================================================
-- 10. FIX: users table (ensure proper policies)
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (id = auth.uid());

-- =====================================================
-- 11. FIX: permissions table
-- =====================================================
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage permissions" ON public.permissions;

-- File owners can view permissions for their files
CREATE POLICY "Owners can view permissions"
ON public.permissions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.files 
        WHERE files.id = permissions.file_id 
        AND files.owner_id = auth.uid()
    )
);

-- File owners can manage permissions
CREATE POLICY "Owners can manage permissions"
ON public.permissions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.files 
        WHERE files.id = permissions.file_id 
        AND files.owner_id = auth.uid()
    )
);

-- =====================================================
-- 12. FIX: viewing_sessions table
-- =====================================================
ALTER TABLE public.viewing_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view viewing sessions" ON public.viewing_sessions;

-- File owners can view sessions for their files
CREATE POLICY "Owners can view viewing sessions"
ON public.viewing_sessions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.files 
        WHERE files.id = viewing_sessions.file_id 
        AND files.owner_id = auth.uid()
    )
);

-- Service role can manage viewing sessions
CREATE POLICY "Service role can manage viewing sessions"
ON public.viewing_sessions FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- Done! Re-run Supabase Advisor to verify fixes
-- =====================================================
