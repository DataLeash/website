-- Link Sharing Detection / Leaker Detection Tables
-- Detects when someone shares their access link to unauthorized recipients

-- =============================================================
-- ACCESS TOKENS TABLE - Unique tokens per recipient
-- =============================================================
CREATE TABLE IF NOT EXISTS public.access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to file and recipient
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    
    -- Unique token for the link
    token VARCHAR(64) NOT NULL UNIQUE,
    
    -- First fingerprint that used this token (for comparison)
    original_fingerprint_hash VARCHAR(64),
    original_fingerprint JSONB,
    
    -- Track all unique fingerprints that accessed this token
    fingerprints_seen JSONB DEFAULT '[]'::jsonb,
    unique_devices_count INTEGER DEFAULT 0,
    
    -- Usage tracking
    access_count INTEGER DEFAULT 0,
    first_accessed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_shared_detected BOOLEAN DEFAULT false,
    shared_detected_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Owner for RLS
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_access_tokens_token ON public.access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_access_tokens_file_id ON public.access_tokens(file_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_owner_id ON public.access_tokens(owner_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_is_shared ON public.access_tokens(is_shared_detected);

-- =============================================================
-- SUSPECTED LEAKERS TABLE - Tracks all leak incidents
-- =============================================================
CREATE TABLE IF NOT EXISTS public.suspected_leakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who leaked
    original_recipient_email VARCHAR(255) NOT NULL,
    original_recipient_name VARCHAR(255),
    original_fingerprint_hash VARCHAR(64),
    
    -- The file that was leaked
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    
    -- The unauthorized accessor (who received the shared link)
    unauthorized_fingerprint_hash VARCHAR(64) NOT NULL,
    unauthorized_fingerprint JSONB,
    unauthorized_ip VARCHAR(45),
    unauthorized_ip_info JSONB,
    unauthorized_location VARCHAR(255),
    
    -- Access token used
    access_token_id UUID REFERENCES public.access_tokens(id),
    
    -- Detection details
    detection_type VARCHAR(50) DEFAULT 'fingerprint_mismatch', -- fingerprint_mismatch, multiple_ips, suspicious_pattern
    similarity_score INTEGER DEFAULT 0, -- 0-100, how similar the fingerprints are
    
    -- Status
    status VARCHAR(20) DEFAULT 'unreviewed', -- unreviewed, confirmed_leak, false_positive, blacklisted
    reviewed_at TIMESTAMPTZ,
    reviewed_notes TEXT,
    
    -- Timestamps
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Owner for RLS
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suspected_leakers_owner_id ON public.suspected_leakers(owner_id);
CREATE INDEX IF NOT EXISTS idx_suspected_leakers_file_id ON public.suspected_leakers(file_id);
CREATE INDEX IF NOT EXISTS idx_suspected_leakers_status ON public.suspected_leakers(status);
CREATE INDEX IF NOT EXISTS idx_suspected_leakers_original_email ON public.suspected_leakers(original_recipient_email);

-- Enable RLS
ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspected_leakers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for access_tokens
CREATE POLICY "Users can view their own tokens" ON public.access_tokens
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create their own tokens" ON public.access_tokens
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own tokens" ON public.access_tokens
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own tokens" ON public.access_tokens
    FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "Service bypass for access_tokens" ON public.access_tokens
    FOR ALL USING (true);

-- RLS Policies for suspected_leakers
CREATE POLICY "Users can view their leakers" ON public.suspected_leakers
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create leaker records" ON public.suspected_leakers
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their leaker records" ON public.suspected_leakers
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their leaker records" ON public.suspected_leakers
    FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "Service bypass for suspected_leakers" ON public.suspected_leakers
    FOR ALL USING (true);
