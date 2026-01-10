-- Sessions table for continuous authorization and real-time monitoring
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    viewer_email VARCHAR(255) NOT NULL,
    viewer_name VARCHAR(255),
    fingerprint JSONB,
    ip_address INET,
    ip_info JSONB,
    device_info TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_reason TEXT,
    session_duration INTEGER -- in seconds
);

-- Index for fast lookups
CREATE INDEX idx_sessions_file_active ON public.sessions(file_id, is_active);
CREATE INDEX idx_sessions_viewer ON public.sessions(viewer_email);
CREATE INDEX idx_sessions_heartbeat ON public.sessions(last_heartbeat) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Policy: File owners can view sessions for their files
CREATE POLICY "Owners can view file sessions" ON public.sessions
    FOR SELECT USING (
        file_id IN (SELECT id FROM public.files WHERE owner_id = auth.uid())
    );

-- Policy: Anyone can insert (for anonymous viewers)
CREATE POLICY "Anyone can create sessions" ON public.sessions
    FOR INSERT WITH CHECK (true);

-- Policy: Sessions can be updated (for heartbeat)
CREATE POLICY "Sessions can be updated" ON public.sessions
    FOR UPDATE USING (true);

-- Function to auto-expire stale sessions (no heartbeat for 60s)
CREATE OR REPLACE FUNCTION expire_stale_sessions()
RETURNS void AS $$
BEGIN
    UPDATE public.sessions
    SET is_active = FALSE,
        ended_at = NOW(),
        session_duration = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
    WHERE is_active = TRUE
      AND last_heartbeat < NOW() - INTERVAL '60 seconds';
END;
$$ LANGUAGE plpgsql;
