-- Access Tokens Table for Unique Per-Recipient Links
-- This prevents link sharing by tying each access token to a specific recipient

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
    expires_at TIMESTAMPTZ, -- Optional expiration
    
    -- Owner for RLS
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_access_tokens_token ON public.access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_access_tokens_file_id ON public.access_tokens(file_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_owner_id ON public.access_tokens(owner_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_recipient_email ON public.access_tokens(recipient_email);

-- Enable RLS
ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tokens" ON public.access_tokens
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own tokens" ON public.access_tokens
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own tokens" ON public.access_tokens
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own tokens" ON public.access_tokens
    FOR DELETE USING (auth.uid() = owner_id);

-- Service role bypass for API operations
CREATE POLICY "Service role bypass for access_tokens" ON public.access_tokens
    FOR ALL USING (true);
