-- Data Leash Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    full_name VARCHAR(255) NOT NULL,
    qid VARCHAR(50) UNIQUE NOT NULL,
    qid_verified BOOLEAN DEFAULT FALSE,
    totp_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    trust_score INTEGER DEFAULT 0
);

-- Devices table
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- 'windows', 'macos', 'ios', 'android'
    hardware_id VARCHAR(255) UNIQUE NOT NULL,
    tpm_attestation TEXT,
    is_trusted BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
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

-- Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trust_level INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    nda_signed BOOLEAN DEFAULT FALSE,
    nda_signed_at TIMESTAMP WITH TIME ZONE,
    can_comment BOOLEAN DEFAULT FALSE,
    can_sign BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(file_id, user_id)
);

-- Key shards table (for 4-key system)
CREATE TABLE IF NOT EXISTS public.key_shards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    shard_index INTEGER NOT NULL,
    shard_data TEXT NOT NULL, -- encrypted shard
    expires_at TIMESTAMP WITH TIME ZONE,
    is_destroyed BOOLEAN DEFAULT FALSE,
    UNIQUE(file_id, shard_index)
);

-- Access logs table
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'view', 'denied', 'revoked', 'expired', 'blocked', 'login', 'chain_kill'
    ip_address INET,
    location JSONB, -- {country, city, lat, lng}
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_duration INTEGER, -- seconds
    ai_risk_score INTEGER
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'access_request', 'view', 'threat', 'revoke', 'expiry'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    page_number INTEGER,
    position_x FLOAT,
    position_y FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_shards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can manage their own devices
CREATE POLICY "Users can read own devices" ON public.devices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" ON public.devices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read files they own or have permission to
CREATE POLICY "Users can read own files" ON public.files
    FOR SELECT USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.permissions 
            WHERE file_id = files.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own files" ON public.files
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own files" ON public.files
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own files" ON public.files
    FOR DELETE USING (auth.uid() = owner_id);

-- Permissions - owners can manage, recipients can read
CREATE POLICY "File owners can manage permissions" ON public.permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.files 
            WHERE id = permissions.file_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can read own permissions" ON public.permissions
    FOR SELECT USING (auth.uid() = user_id);

-- Key shards - only file owner can access
CREATE POLICY "File owners can manage key shards" ON public.key_shards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.files 
            WHERE id = key_shards.file_id AND owner_id = auth.uid()
        )
    );

-- Access logs - owners and users can read their own logs
CREATE POLICY "Users can read own access logs" ON public.access_logs
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.files 
            WHERE id = access_logs.file_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert access logs" ON public.access_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications - users can read their own
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Comments - based on file permissions
CREATE POLICY "Users can read comments on accessible files" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.files 
            WHERE id = comments.file_id AND (
                owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.permissions 
                    WHERE file_id = files.id AND user_id = auth.uid()
                )
            )
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_owner ON public.files(owner_id);
CREATE INDEX IF NOT EXISTS idx_permissions_file ON public.permissions(file_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user ON public.permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_file ON public.access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = FALSE;

-- Create storage bucket for protected files
INSERT INTO storage.buckets (id, name, public)
VALUES ('protected-files', 'protected-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy - only owners can upload/download their files
CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'protected-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can read own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'protected-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
