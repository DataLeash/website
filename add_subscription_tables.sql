-- Subscription System Tables for DataLeash
-- Run this in Supabase SQL Editor

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,  -- 'free', 'pro', 'enterprise'
    name TEXT NOT NULL,
    description TEXT,
    price_monthly INTEGER DEFAULT 0,  -- Price in cents (2900 = $29.00)
    stripe_price_id TEXT,  -- Stripe Price ID for recurring billing
    max_files INTEGER,  -- NULL = unlimited
    max_storage_mb INTEGER,  -- NULL = unlimited  
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO public.subscription_plans (id, name, description, price_monthly, max_files, max_storage_mb, features) VALUES
    ('free', 'Free', 'Get started with DataLeash', 0, 5, 100, '{"basic_analytics": true, "email_otp": true, "access_logs_days": 7}'::jsonb),
    ('pro', 'Pro', 'For professionals and teams', 2900, NULL, 10000, '{"kill_switch": true, "ai_threat_detection": true, "screenshot_blocking": true, "unlimited_files": true, "access_logs_days": 90, "priority_support": true}'::jsonb),
    ('enterprise', 'Enterprise', 'Custom solutions for large organizations', NULL, NULL, NULL, '{"sso_saml": true, "dedicated_support": true, "custom_integrations": true, "sla_guarantee": true, "unlimited_everything": true}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    max_files = EXCLUDED.max_files,
    max_storage_mb = EXCLUDED.max_storage_mb,
    features = EXCLUDED.features;

-- Payments History Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    stripe_payment_id TEXT,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    plan_id TEXT REFERENCES public.subscription_plans(id),
    amount INTEGER NOT NULL,  -- Amount in cents
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled')),
    payment_method TEXT,  -- 'card', 'paypal', etc.
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add stripe_customer_id to users table for recurring payments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE public.users ADD COLUMN stripe_customer_id TEXT;
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_sub ON public.payments(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON public.users(stripe_customer_id);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can read subscription plans (they're public info)
CREATE POLICY "Anyone can read subscription plans" ON public.subscription_plans
    FOR SELECT USING (true);

-- Users can only read their own payments
CREATE POLICY "Users can read own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert payments (for webhook)
CREATE POLICY "Service can insert payments" ON public.payments
    FOR INSERT WITH CHECK (true);

-- Service role can update payments
CREATE POLICY "Service can update payments" ON public.payments
    FOR UPDATE USING (true);

-- Add viewer_oauth_provider column to access_requests for tracking OAuth login method
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'access_requests' AND column_name = 'viewer_oauth_provider'
    ) THEN
        ALTER TABLE public.access_requests ADD COLUMN viewer_oauth_provider TEXT;
    END IF;
END $$;

-- Add viewer_oauth_id column to access_requests
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'access_requests' AND column_name = 'viewer_oauth_id'
    ) THEN
        ALTER TABLE public.access_requests ADD COLUMN viewer_oauth_id TEXT;
    END IF;
END $$;
