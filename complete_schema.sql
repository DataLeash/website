-- DataLeash Complete Database Schema (v2.0)
-- Includes all core tables plus tracking, analytics, and protection modules.

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Identity & Access
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.5 Trusted Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Core File Logic
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    encryption_key_id UUID NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb, -- {total_views, last_viewed, expires_at, etc}
    iv VARCHAR(64),
    auth_tag VARCHAR(64),
    storage_path VARCHAR(500),
    is_destroyed BOOLEAN DEFAULT FALSE,
    destroyed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Viewing Sessions (The "Live" Tracking Table)
CREATE TABLE IF NOT EXISTS public.viewing_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    viewer_email VARCHAR(255),
    viewer_name VARCHAR(255),
    ip_address INET,
    ip_info JSONB, -- {city, country, isp, org}
    device_info JSONB, -- {browser, os, device}
    fingerprint JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- 4. Access Requests (The "Gatekeeper" Log)
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, denied
    ip_address INET,
    location JSONB, -- {city, country, lat, lon}
    fingerprint JSONB, -- The raw fingerprint data
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Suspected Leakers (The "Hunter" Log)
CREATE TABLE IF NOT EXISTS public.suspected_leakers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    
    -- Evidence
    original_recipient_email VARCHAR(255),
    original_recipient_name VARCHAR(255),
    original_fingerprint_hash VARCHAR(255),
    
    unauthorized_fingerprint_hash VARCHAR(255),
    unauthorized_fingerprint JSONB,
    unauthorized_ip VARCHAR(50),
    unauthorized_ip_info JSONB,
    unauthorized_location VARCHAR(255),
    
    detection_type VARCHAR(50), -- fingerprint_mismatch, token_reuse
    similarity_score INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'unreviewed', -- unreviewed, confirmed_leak, false_positive, blacklisted
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_notes TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Blacklist (The "Shield")
CREATE TABLE IF NOT EXISTS public.blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_email VARCHAR(255),
    blocked_name VARCHAR(255),
    fingerprint JSONB, -- Stored fingerprint to block devices
    ip_address VARCHAR(50),
    ip_info JSONB,
    reason TEXT,
    match_count INTEGER DEFAULT 0,
    last_match_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- view, threat, access_request
    title VARCHAR(255) NOT NULL,
    message TEXT,
    file_id UUID,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Access Logs (Legacy/Historical)
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    ip_address INET,
    location JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_duration INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_active ON public.viewing_sessions(file_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_leakers_owner ON public.suspected_leakers(owner_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_owner ON public.blacklist(owner_id);

-- Storage Policy Setup (Example)
INSERT INTO storage.buckets (id, name, public) VALUES ('protected-files', 'protected-files', false) ON CONFLICT DO NOTHING;
