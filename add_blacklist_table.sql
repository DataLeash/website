-- Blacklist table for storing blocked devices with full fingerprint data
-- When a user is blacklisted, all their device info is saved for future matching

CREATE TABLE IF NOT EXISTS public.blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Person info
    blocked_email VARCHAR(255),
    blocked_name VARCHAR(255),
    reason TEXT,
    
    -- Full fingerprint data (for matching)
    fingerprint JSONB NOT NULL,
    
    -- Key matching fields extracted for faster queries
    canvas_hash VARCHAR(100),
    webgl_hash VARCHAR(100),
    audio_hash VARCHAR(100),
    font_hash VARCHAR(100),
    combined_hash VARCHAR(100),
    
    -- IP info at time of block
    ip_address INET,
    ip_info JSONB,
    
    -- Metadata
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    -- Match tracking
    match_count INTEGER DEFAULT 0,
    last_match_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for fast fingerprint matching
CREATE INDEX IF NOT EXISTS idx_blacklist_owner ON public.blacklist(owner_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_combined_hash ON public.blacklist(combined_hash);
CREATE INDEX IF NOT EXISTS idx_blacklist_canvas_hash ON public.blacklist(canvas_hash);
CREATE INDEX IF NOT EXISTS idx_blacklist_webgl_hash ON public.blacklist(webgl_hash);
CREATE INDEX IF NOT EXISTS idx_blacklist_email ON public.blacklist(blocked_email);

-- Enable RLS
ALTER TABLE public.blacklist ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own blacklist" ON public.blacklist
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can add to blacklist" ON public.blacklist
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own blacklist" ON public.blacklist
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete from blacklist" ON public.blacklist
    FOR DELETE USING (auth.uid() = owner_id);
