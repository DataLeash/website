-- OTP Codes table for production email verification
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    viewer_name VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON public.otp_codes(expires_at);

-- Clean up expired OTPs automatically (run as a cron job in production)
-- DELETE FROM public.otp_codes WHERE expires_at < NOW();

-- RLS: Allow service role full access (we use service role for OTP)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy for service role to manage OTP codes
CREATE POLICY "Service role can manage OTP codes" ON public.otp_codes
    FOR ALL 
    USING (true)
    WITH CHECK (true);
