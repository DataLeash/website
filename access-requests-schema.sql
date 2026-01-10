-- Access Requests table for owner approval workflow
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    viewer_email VARCHAR(255) NOT NULL,
    viewer_name VARCHAR(255),
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_access_requests_file ON public.access_requests(file_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON public.access_requests(viewer_email);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- File owners can see requests for their files
CREATE POLICY "Owners can view access requests" ON public.access_requests
    FOR SELECT USING (
        file_id IN (SELECT id FROM public.files WHERE owner_id = auth.uid())
    );

-- File owners can update request status
CREATE POLICY "Owners can update access requests" ON public.access_requests
    FOR UPDATE USING (
        file_id IN (SELECT id FROM public.files WHERE owner_id = auth.uid())
    );

-- Service role can insert (for API routes)
CREATE POLICY "Service role can insert requests" ON public.access_requests
    FOR INSERT WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "Service role full access" ON public.access_requests
    FOR ALL USING (true) WITH CHECK (true);
