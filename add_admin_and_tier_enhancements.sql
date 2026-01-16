-- DataLeash Admin & Tier Enhancement Migration
-- Run this in Supabase SQL Editor
-- Created: 2026-01-16

-- =====================================================
-- PHASE 1: Add missing columns to users table
-- =====================================================

-- Ko-fi subscription tracking
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'kofi_subscription_id'
    ) THEN
        ALTER TABLE public.users ADD COLUMN kofi_subscription_id TEXT;
    END IF;
END $$;

-- Email used for Ko-fi payment (may differ from account email)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'kofi_email'
    ) THEN
        ALTER TABLE public.users ADD COLUMN kofi_email TEXT;
    END IF;
END $$;

-- Payment source tracking
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'payment_source'
    ) THEN
        ALTER TABLE public.users ADD COLUMN payment_source TEXT CHECK (payment_source IN ('kofi', 'stripe', 'paypal', 'manual'));
    END IF;
END $$;

-- Admin flag
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Last login tracking
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;
END $$;

-- Account status
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'account_status'
    ) THEN
        ALTER TABLE public.users ADD COLUMN account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned'));
    END IF;
END $$;

-- =====================================================
-- PHASE 2: Create payment_logs table for audit trail
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_source TEXT NOT NULL CHECK (payment_source IN ('kofi', 'stripe', 'paypal', 'manual')),
    transaction_id TEXT UNIQUE,
    
    -- Subscription details
    is_subscription BOOLEAN DEFAULT FALSE,
    is_first_payment BOOLEAN DEFAULT FALSE,
    tier_name TEXT,
    
    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- What was granted
    tier_granted TEXT CHECK (tier_granted IN ('pro', 'enterprise')),
    tier_duration_days INTEGER,
    tier_expires_at TIMESTAMPTZ,
    
    -- Auto-activation status
    auto_activated BOOLEAN DEFAULT FALSE,
    manual_review_required BOOLEAN DEFAULT FALSE,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    
    -- Metadata
    raw_webhook_data JSONB,
    admin_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PHASE 3: Create admin_actions table for audit trail  
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.users(id),
    admin_email TEXT NOT NULL,
    
    -- Action details
    action_type TEXT NOT NULL CHECK (action_type IN (
        'tier_upgrade', 'tier_downgrade', 
        'user_suspend', 'user_activate', 'user_ban',
        'payment_manual', 'payment_refund',
        'file_delete', 'file_restore'
    )),
    
    -- Target
    target_user_id UUID REFERENCES public.users(id),
    target_user_email TEXT,
    target_file_id UUID,
    
    -- Details
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PHASE 4: Performance indexes
-- =====================================================

-- Tier queries
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);
CREATE INDEX IF NOT EXISTS idx_users_tier_expires ON public.users(tier_expires_at) WHERE tier_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_status);

-- Payment lookups
CREATE INDEX IF NOT EXISTS idx_payment_logs_user ON public.payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_email ON public.payment_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction ON public.payment_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created ON public.payment_logs(created_at DESC);

-- Admin actions
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON public.admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON public.admin_actions(created_at DESC);

-- =====================================================
-- PHASE 5: RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Payment logs: Only admins can read all, users can read their own
CREATE POLICY "Users can read own payments" ON public.payment_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to payment_logs" ON public.payment_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Admin actions: Only service role (admin APIs use service key)
CREATE POLICY "Service role full access to admin_actions" ON public.admin_actions
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- PHASE 6: Set your admin user(s)
-- Replace 'your-email@example.com' with your actual admin email
-- =====================================================

-- UPDATE public.users SET is_admin = TRUE WHERE email = 'your-admin-email@example.com';

-- =====================================================
-- Useful queries for admin
-- =====================================================

-- View all Pro users:
-- SELECT email, tier, tier_started_at, tier_expires_at, payment_source, kofi_subscription_id 
-- FROM users WHERE tier = 'pro' ORDER BY tier_started_at DESC;

-- View expired subscriptions:
-- SELECT email, tier, tier_expires_at FROM users 
-- WHERE tier = 'pro' AND tier_expires_at < NOW();

-- View payment history:
-- SELECT * FROM payment_logs ORDER BY created_at DESC LIMIT 50;

-- User stats:
-- SELECT tier, COUNT(*) as count FROM users GROUP BY tier;
