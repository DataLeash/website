-- DataLeash "A to Z" Complete Database Setup
-- Run this ENTIRE script in your Supabase SQL Editor.
-- This handles: Table creation, Column updates, Security Policies (RLS), and Storage permissions.

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Core Tables (Safe to run if they exist)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Extra columns might be added later
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    encryption_key_id UUID NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    iv VARCHAR(64),
    auth_tag VARCHAR(64),
    storage_path VARCHAR(500),
    is_destroyed BOOLEAN DEFAULT FALSE,
    destroyed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trust_level INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    can_comment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(file_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    viewer_email VARCHAR(255), -- renamed from email to match code usage if needed, but keeping compliant
    viewer_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    ip_address INET,
    location JSONB,
    fingerprint JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Ensure viewer_email exists if table existed with 'email'
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_requests' AND column_name='email') THEN
        ALTER TABLE public.access_requests RENAME COLUMN email TO viewer_email;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='access_requests' AND column_name='viewer_email') THEN
        ALTER TABLE public.access_requests ADD COLUMN viewer_email VARCHAR(255);
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS public.key_shards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    shard_index INTEGER NOT NULL,
    shard_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(file_id, shard_index)
);

CREATE TABLE IF NOT EXISTS public.viewing_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    viewer_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    viewer_email TEXT,
    viewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email TEXT,
    amount DECIMAL(10,2),
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    location JSONB
);

CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.users(id),
    admin_email TEXT,
    action_type TEXT,
    target_user_id UUID,
    target_user_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add Missing Columns (Idempotent)
DO $$ BEGIN
    -- Users table enhancements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin') THEN
        ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier') THEN
        ALTER TABLE public.users ADD COLUMN tier VARCHAR(50) DEFAULT 'free';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier_expires_at') THEN
        ALTER TABLE public.users ADD COLUMN tier_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'account_status') THEN
        ALTER TABLE public.users ADD COLUMN account_status TEXT DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kofi_email') THEN
        ALTER TABLE public.users ADD COLUMN kofi_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'payment_source') THEN
        ALTER TABLE public.users ADD COLUMN payment_source TEXT;
    END IF;
END $$;

-- 4. Apply Strict Security Policies (RLS)

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_shards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Reset all policies to ensure clean state
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own files" ON public.files;
DROP POLICY IF EXISTS "Users can insert own files" ON public.files;
DROP POLICY IF EXISTS "Users can update own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete own files" ON public.files;
DROP POLICY IF EXISTS "Service role only for key_shards" ON public.key_shards;
DROP POLICY IF EXISTS "Owners can view access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Anyone can create access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Owners can update access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Owners can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Owners can manage permissions" ON public.permissions;
DROP POLICY IF EXISTS "Service role full access to payment_logs" ON public.payment_logs;
DROP POLICY IF EXISTS "Users can read own payments" ON public.payment_logs;
DROP POLICY IF EXISTS "Service role full access to admin_actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Service role full access to access_logs" ON public.access_logs;
DROP POLICY IF EXISTS "Users can insert access logs" ON public.access_logs;
DROP POLICY IF EXISTS "Users can read own access logs" ON public.access_logs;

-- USERS
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- FILES
CREATE POLICY "Users can read own files" ON public.files FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own files" ON public.files FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own files" ON public.files FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own files" ON public.files FOR DELETE USING (auth.uid() = owner_id);

-- KEY SHARDS (Private!)
CREATE POLICY "Service role only for key_shards" ON public.key_shards FOR ALL USING (auth.role() = 'service_role');

-- ACCESS REQUESTS
CREATE POLICY "Owners can view access requests" ON public.access_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.files WHERE files.id = access_requests.file_id AND files.owner_id = auth.uid())
);
CREATE POLICY "Anyone can create access requests" ON public.access_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can update access requests" ON public.access_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.files WHERE files.id = access_requests.file_id AND files.owner_id = auth.uid())
);

-- PERMISSIONS
CREATE POLICY "Owners can view permissions" ON public.permissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.files WHERE files.id = permissions.file_id AND files.owner_id = auth.uid())
);
CREATE POLICY "Owners can manage permissions" ON public.permissions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.files WHERE files.id = permissions.file_id AND files.owner_id = auth.uid())
);

-- ADMIN & LOGS
CREATE POLICY "Service role full access to payment_logs" ON public.payment_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can read own payments" ON public.payment_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to admin_actions" ON public.admin_actions FOR ALL USING (auth.role() = 'service_role');

-- ACCESS LOGS
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to access_logs" ON public.access_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can insert access logs" ON public.access_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own access logs" ON public.access_logs FOR SELECT USING (auth.uid() = user_id);


-- 5. Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public) VALUES ('protected-files', 'protected-files', false) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Remove old policies first
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;

-- Allow upload
CREATE POLICY "Users can upload own files" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'protected-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow owner read
CREATE POLICY "Users can read own files" ON storage.objects FOR SELECT USING (
    bucket_id = 'protected-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow Service Role (Server) full access to decrypt
CREATE POLICY "Service role full access" ON storage.objects FOR ALL USING (auth.role() = 'service_role');
