-- DataLeash Consolidated RLS & Admin Policies
-- Version: 2.0.0
-- Date: 2026-01-16
-- Description: Clean, non-recursive RLS policies with proper admin bypass
-- IMPORTANT: Run this AFTER backing up your database

-- =====================================================
-- PHASE 0: Create admin helper function (SECURITY DEFINER)
-- This function runs with definer privileges to avoid RLS recursion
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS auth.is_admin();

-- Create admin check function that bypasses RLS
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_admin FROM public.users WHERE id = auth.uid()),
        FALSE
    );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated;

-- =====================================================
-- PHASE 1: Drop ALL existing policies to start clean
-- =====================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;

-- Files table policies
DROP POLICY IF EXISTS "Users can view own files" ON public.files;
DROP POLICY IF EXISTS "Users can create files" ON public.files;
DROP POLICY IF EXISTS "Users can update own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete own files" ON public.files;
DROP POLICY IF EXISTS "Owners can manage their files" ON public.files;

-- Access requests policies
DROP POLICY IF EXISTS "All operations on access_requests" ON public.access_requests;
DROP POLICY IF EXISTS "Users can view their own access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Users can create access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Owners can view access requests for their files" ON public.access_requests;
DROP POLICY IF EXISTS "Anyone can create access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Owners can update access requests" ON public.access_requests;

-- Access tokens policies
DROP POLICY IF EXISTS "All operations on access_tokens" ON public.access_tokens;
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.access_tokens;
DROP POLICY IF EXISTS "Users can create tokens" ON public.access_tokens;
DROP POLICY IF EXISTS "Users can delete their tokens" ON public.access_tokens;
DROP POLICY IF EXISTS "Owners can view tokens for their files" ON public.access_tokens;
DROP POLICY IF EXISTS "Owners can create tokens for their files" ON public.access_tokens;
DROP POLICY IF EXISTS "Owners can delete tokens for their files" ON public.access_tokens;

-- Sessions policies
DROP POLICY IF EXISTS "All operations on sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;

-- Viewing sessions policies
DROP POLICY IF EXISTS "Owners can view viewing sessions" ON public.viewing_sessions;
DROP POLICY IF EXISTS "Service role can manage viewing sessions" ON public.viewing_sessions;

-- Access logs policies
DROP POLICY IF EXISTS "Owners can view access logs" ON public.access_logs;
DROP POLICY IF EXISTS "Owners can view access logs for their files" ON public.access_logs;
DROP POLICY IF EXISTS "Service role can insert access logs" ON public.access_logs;

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Blacklist policies
DROP POLICY IF EXISTS "Owners can manage blacklist" ON public.blacklist;

-- Suspected leakers policies
DROP POLICY IF EXISTS "All operations on suspected_leakers" ON public.suspected_leakers;
DROP POLICY IF EXISTS "Owners can view suspected leakers" ON public.suspected_leakers;
DROP POLICY IF EXISTS "Owners can manage suspected leakers" ON public.suspected_leakers;

-- Permissions policies
DROP POLICY IF EXISTS "Owners can manage permissions" ON public.permissions;
DROP POLICY IF EXISTS "Owners can view permissions" ON public.permissions;

-- Key shards policies
DROP POLICY IF EXISTS "Service role only for key_shards" ON public.key_shards;
DROP POLICY IF EXISTS "Owners can manage key shards" ON public.key_shards;

-- OTP codes policies
DROP POLICY IF EXISTS "All operations on otp_codes" ON public.otp_codes;
DROP POLICY IF EXISTS "Service role full access" ON public.otp_codes;
DROP POLICY IF EXISTS "Service role only for otp_codes" ON public.otp_codes;

-- Payment logs policies
DROP POLICY IF EXISTS "Users can read own payments" ON public.payment_logs;
DROP POLICY IF EXISTS "Service role full access to payment_logs" ON public.payment_logs;

-- Admin actions policies
DROP POLICY IF EXISTS "Service role full access to admin_actions" ON public.admin_actions;

-- Contacts policies
DROP POLICY IF EXISTS "Users can manage their contacts" ON public.contacts;

-- =====================================================
-- PHASE 2: Enable RLS on all tables
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspected_leakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Optional tables (may not exist)
DO $$ BEGIN
    ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.key_shards ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- =====================================================
-- PHASE 3: Create clean RLS policies
-- =====================================================

-- ============ USERS TABLE ============
-- Users can view their own profile OR admins can view all
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT USING (id = auth.uid() OR auth.is_admin());

-- Users can update their own profile only (admins use service role)
CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE USING (id = auth.uid());

-- Insert handled by auth trigger/service role only

-- ============ FILES TABLE ============
-- Owners can view their files, admins can view all
CREATE POLICY "files_select_policy" ON public.files
    FOR SELECT USING (owner_id = auth.uid() OR auth.is_admin());

-- Owners can create files for themselves
CREATE POLICY "files_insert_policy" ON public.files
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Owners can update their files
CREATE POLICY "files_update_policy" ON public.files
    FOR UPDATE USING (owner_id = auth.uid() OR auth.is_admin());

-- Owners can delete their files (soft delete)
CREATE POLICY "files_delete_policy" ON public.files
    FOR DELETE USING (owner_id = auth.uid() OR auth.is_admin());

-- ============ ACCESS REQUESTS TABLE ============
-- File owners can view requests for their files, admins can view all
CREATE POLICY "access_requests_select_policy" ON public.access_requests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.files WHERE files.id = access_requests.file_id AND files.owner_id = auth.uid())
        OR auth.is_admin()
    );

-- Anyone can create access requests
CREATE POLICY "access_requests_insert_policy" ON public.access_requests
    FOR INSERT WITH CHECK (true);

-- File owners can update (approve/deny) requests
CREATE POLICY "access_requests_update_policy" ON public.access_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.files WHERE files.id = access_requests.file_id AND files.owner_id = auth.uid())
        OR auth.is_admin()
    );

-- ============ VIEWING SESSIONS TABLE ============
-- File owners can view sessions for their files, admins can view all
CREATE POLICY "viewing_sessions_select_policy" ON public.viewing_sessions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.files WHERE files.id = viewing_sessions.file_id AND files.owner_id = auth.uid())
        OR auth.is_admin()
    );

-- Insert/update handled by service role from API

-- ============ ACCESS LOGS TABLE ============
-- Users can view logs for their files, admins can view all
CREATE POLICY "access_logs_select_policy" ON public.access_logs
    FOR SELECT USING (
        user_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM public.files WHERE files.id = access_logs.file_id AND files.owner_id = auth.uid())
        OR auth.is_admin()
    );

-- Insert allowed for own logs or service role
CREATE POLICY "access_logs_insert_policy" ON public.access_logs
    FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.is_admin());

-- ============ NOTIFICATIONS TABLE ============
-- Users can view their own notifications
CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update (mark read) their own notifications
CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Insert via service role (API routes create notifications)

-- ============ BLACKLIST TABLE ============
-- Users can manage their own blacklist, admins can view all
CREATE POLICY "blacklist_select_policy" ON public.blacklist
    FOR SELECT USING (owner_id = auth.uid() OR auth.is_admin());

CREATE POLICY "blacklist_insert_policy" ON public.blacklist
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "blacklist_update_policy" ON public.blacklist
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "blacklist_delete_policy" ON public.blacklist
    FOR DELETE USING (owner_id = auth.uid());

-- ============ SUSPECTED LEAKERS TABLE ============
-- File owners can view leakers for their files, admins can view all
CREATE POLICY "suspected_leakers_select_policy" ON public.suspected_leakers
    FOR SELECT USING (
        owner_id = auth.uid() OR auth.is_admin()
    );

CREATE POLICY "suspected_leakers_all_policy" ON public.suspected_leakers
    FOR ALL USING (owner_id = auth.uid() OR auth.is_admin());

-- ============ CONTACTS TABLE ============
-- Users can manage their own contacts
CREATE POLICY "contacts_select_policy" ON public.contacts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "contacts_insert_policy" ON public.contacts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "contacts_delete_policy" ON public.contacts
    FOR DELETE USING (user_id = auth.uid());

-- ============ ACCESS TOKENS TABLE (if exists) ============
DO $$ BEGIN
    CREATE POLICY "access_tokens_select_policy" ON public.access_tokens
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.files WHERE files.id = access_tokens.file_id AND files.owner_id = auth.uid())
            OR auth.is_admin()
        );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "access_tokens_insert_policy" ON public.access_tokens
        FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.files WHERE files.id = access_tokens.file_id AND files.owner_id = auth.uid())
        );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "access_tokens_delete_policy" ON public.access_tokens
        FOR DELETE USING (
            EXISTS (SELECT 1 FROM public.files WHERE files.id = access_tokens.file_id AND files.owner_id = auth.uid())
        );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============ SESSIONS TABLE (if exists) ============
DO $$ BEGIN
    CREATE POLICY "sessions_select_policy" ON public.sessions
        FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "sessions_delete_policy" ON public.sessions
        FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============ KEY SHARDS TABLE (if exists) - Service role only ============
DO $$ BEGIN
    CREATE POLICY "key_shards_service_only" ON public.key_shards
        FOR ALL USING (false); -- Block all client access, service role bypasses RLS
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============ OTP CODES TABLE (if exists) - Service role only ============
DO $$ BEGIN
    CREATE POLICY "otp_codes_service_only" ON public.otp_codes
        FOR ALL USING (false); -- Block all client access
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============ PAYMENT LOGS TABLE (if exists) ============
DO $$ BEGIN
    CREATE POLICY "payment_logs_select_policy" ON public.payment_logs
        FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============ ADMIN ACTIONS TABLE (if exists) - Admin read only ============
DO $$ BEGIN
    CREATE POLICY "admin_actions_select_policy" ON public.admin_actions
        FOR SELECT USING (auth.is_admin());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- =====================================================
-- PHASE 4: Verify admin user is set
-- =====================================================

-- Ensure the admin email from env has is_admin = true
-- Replace 'admin@dataleash.io' with your actual admin email
UPDATE public.users SET is_admin = TRUE WHERE email = 'admin@dataleash.io';

-- =====================================================
-- VERIFICATION QUERIES (run these to verify)
-- =====================================================

-- Check admin function works:
-- SELECT auth.is_admin();

-- Check policies exist:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- Count policies per table:
-- SELECT tablename, COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public' GROUP BY tablename;
