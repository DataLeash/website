-- ============================================
-- DataLeash Complete Admin Database Setup
-- Run this in Supabase SQL Editor
-- ============================================
-- This script will:
-- 1. Add all missing columns to users table
-- 2. Create admin_actions table for audit logging
-- 3. Create payment_logs table for payment tracking
-- 4. Create viewing_sessions table for active viewers
-- 5. Set up RLS policies with admin bypass
-- 6. Set your email as admin
-- ============================================

-- ============================================
-- PHASE 1: Add missing columns to users table
-- ============================================

DO $$ 
BEGIN
    -- Tier-related columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'tier') THEN
        ALTER TABLE public.users ADD COLUMN tier VARCHAR(50) DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'tier_started_at') THEN
        ALTER TABLE public.users ADD COLUMN tier_started_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'tier_expires_at') THEN
        ALTER TABLE public.users ADD COLUMN tier_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'payment_source') THEN
        ALTER TABLE public.users ADD COLUMN payment_source VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'kofi_subscription_id') THEN
        ALTER TABLE public.users ADD COLUMN kofi_subscription_id VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'kofi_email') THEN
        ALTER TABLE public.users ADD COLUMN kofi_email VARCHAR(255);
    END IF;

    -- Admin-related columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_admin') THEN
        ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'account_status') THEN
        ALTER TABLE public.users ADD COLUMN account_status VARCHAR(50) DEFAULT 'active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_login_at') THEN
        ALTER TABLE public.users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;

    RAISE NOTICE 'Users table columns added/verified';
END $$;

-- ============================================
-- PHASE 2: Create admin_actions table
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_email VARCHAR(255),
    action_type VARCHAR(100) NOT NULL,
    target_user_id UUID,
    target_user_email VARCHAR(255),
    target_file_id UUID,
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON public.admin_actions(action_type);

-- ============================================
-- PHASE 3: Create payment_logs table
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    payment_source VARCHAR(50),
    payment_id VARCHAR(255),
    subscription_id VARCHAR(255),
    status VARCHAR(50),
    tier_granted VARCHAR(50),
    duration_days INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON public.payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON public.payment_logs(created_at DESC);

-- ============================================
-- PHASE 4: Create viewing_sessions table
-- ============================================

CREATE TABLE IF NOT EXISTS public.viewing_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    viewer_email VARCHAR(255),
    viewer_ip VARCHAR(45),
    viewer_location JSONB,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    session_token VARCHAR(255) UNIQUE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    view_duration_seconds INTEGER DEFAULT 0,
    pages_viewed JSONB DEFAULT '[]'::jsonb,
    security_events JSONB DEFAULT '[]'::jsonb,
    was_revoked BOOLEAN DEFAULT FALSE,
    revoke_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_viewing_sessions_file_id ON public.viewing_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_viewing_sessions_viewer_id ON public.viewing_sessions(viewer_id);
CREATE INDEX IF NOT EXISTS idx_viewing_sessions_active ON public.viewing_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_viewing_sessions_token ON public.viewing_sessions(session_token);

-- ============================================
-- PHASE 5: Create system_settings table
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.system_settings (key, value, description) VALUES
    ('registration_enabled', 'true', 'Allow new user registrations'),
    ('email_verification_required', 'true', 'Require email verification for new accounts'),
    ('max_login_attempts', '5', 'Maximum failed login attempts before lockout'),
    ('session_timeout_hours', '24', 'Session timeout in hours'),
    ('default_user_tier', '"free"', 'Default tier for new users'),
    ('free_tier_file_limit', '5', 'Maximum files for free tier'),
    ('free_tier_storage_mb', '100', 'Maximum storage in MB for free tier'),
    ('pro_tier_file_limit', '100', 'Maximum files for pro tier'),
    ('pro_tier_storage_mb', '5000', 'Maximum storage in MB for pro tier')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- PHASE 6: Create helper function for admin check
-- ============================================

-- Create auth schema if not exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Drop existing function if exists (to update)
DROP FUNCTION IF EXISTS auth.is_admin();

-- Create admin check function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_status BOOLEAN;
BEGIN
    SELECT COALESCE(is_admin, FALSE) INTO admin_status
    FROM public.users
    WHERE id = auth.uid();
    
    RETURN COALESCE(admin_status, FALSE);
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- ============================================
-- PHASE 7: Set up RLS policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate cleanly
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "admin_actions_select_policy" ON public.admin_actions;
DROP POLICY IF EXISTS "admin_actions_insert_policy" ON public.admin_actions;
DROP POLICY IF EXISTS "payment_logs_select_policy" ON public.payment_logs;
DROP POLICY IF EXISTS "payment_logs_insert_policy" ON public.payment_logs;
DROP POLICY IF EXISTS "viewing_sessions_select_policy" ON public.viewing_sessions;
DROP POLICY IF EXISTS "viewing_sessions_insert_policy" ON public.viewing_sessions;
DROP POLICY IF EXISTS "viewing_sessions_update_policy" ON public.viewing_sessions;
DROP POLICY IF EXISTS "system_settings_select_policy" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_update_policy" ON public.system_settings;

-- USERS: Users can see own profile, admins can see all
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT USING (auth.uid() = id OR auth.is_admin());

-- USERS: Users can update own profile, admins can update all
CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE USING (auth.uid() = id OR auth.is_admin());

-- ADMIN_ACTIONS: Only admins can read
CREATE POLICY "admin_actions_select_policy" ON public.admin_actions
    FOR SELECT USING (auth.is_admin());

-- ADMIN_ACTIONS: Only admins can insert (via service role in API)
CREATE POLICY "admin_actions_insert_policy" ON public.admin_actions
    FOR INSERT WITH CHECK (auth.is_admin());

-- PAYMENT_LOGS: Users see own payments, admins see all
CREATE POLICY "payment_logs_select_policy" ON public.payment_logs
    FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());

-- PAYMENT_LOGS: Only service role/admins can insert
CREATE POLICY "payment_logs_insert_policy" ON public.payment_logs
    FOR INSERT WITH CHECK (auth.is_admin());

-- VIEWING_SESSIONS: File owners and admins can see sessions
CREATE POLICY "viewing_sessions_select_policy" ON public.viewing_sessions
    FOR SELECT USING (
        viewer_id = auth.uid() OR 
        auth.is_admin() OR
        EXISTS (SELECT 1 FROM public.files WHERE files.id = viewing_sessions.file_id AND files.owner_id = auth.uid())
    );

-- VIEWING_SESSIONS: Anyone can create a session
CREATE POLICY "viewing_sessions_insert_policy" ON public.viewing_sessions
    FOR INSERT WITH CHECK (TRUE);

-- VIEWING_SESSIONS: Viewers can update own sessions, file owners and admins can update any
CREATE POLICY "viewing_sessions_update_policy" ON public.viewing_sessions
    FOR UPDATE USING (
        viewer_id = auth.uid() OR 
        auth.is_admin() OR
        EXISTS (SELECT 1 FROM public.files WHERE files.id = viewing_sessions.file_id AND files.owner_id = auth.uid())
    );

-- SYSTEM_SETTINGS: Admins only
CREATE POLICY "system_settings_select_policy" ON public.system_settings
    FOR SELECT USING (auth.is_admin());

CREATE POLICY "system_settings_update_policy" ON public.system_settings
    FOR UPDATE USING (auth.is_admin());

-- ============================================
-- PHASE 8: Grant admin to specified users
-- ============================================

-- Set admin for admin@dataleash.io
UPDATE public.users SET is_admin = TRUE WHERE email = 'admin@dataleash.io';

-- Set admin for hadionga3@gmail.com
UPDATE public.users SET is_admin = TRUE WHERE email = 'hadionga3@gmail.com';

-- ============================================
-- PHASE 9: Create trigger for last_login_at
-- ============================================

CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.users 
    SET last_login_at = NOW() 
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;

-- Note: This trigger would need to be attached to auth.sessions if you want auto-update

-- ============================================
-- VERIFICATION: Show final state
-- ============================================

SELECT 'Users table columns:' as info;
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

SELECT 'Admin users:' as info;
SELECT id, email, is_admin, account_status, tier FROM public.users WHERE is_admin = TRUE;

SELECT 'Tables created:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_actions', 'payment_logs', 'viewing_sessions', 'system_settings');

-- ============================================
-- DONE! Your admin portal is now fully powered.
-- ============================================
