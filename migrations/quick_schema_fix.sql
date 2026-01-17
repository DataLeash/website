-- DataLeash Quick Schema Fix
-- Run this in Supabase SQL Editor to add missing columns
-- This is safe to run even if columns already exist

-- Add tier-related columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add tier column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier' AND table_schema = 'public') THEN
        ALTER TABLE public.users ADD COLUMN tier VARCHAR(50) DEFAULT 'free';
        RAISE NOTICE 'Added tier column';
    END IF;

    -- Add tier_started_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier_started_at' AND table_schema = 'public') THEN
        ALTER TABLE public.users ADD COLUMN tier_started_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added tier_started_at column';
    END IF;

    -- Add tier_expires_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier_expires_at' AND table_schema = 'public') THEN
        ALTER TABLE public.users ADD COLUMN tier_expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added tier_expires_at column';
    END IF;

    -- Add payment_source column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'payment_source' AND table_schema = 'public') THEN
        ALTER TABLE public.users ADD COLUMN payment_source VARCHAR(50);
        RAISE NOTICE 'Added payment_source column';
    END IF;

    -- Add kofi_subscription_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kofi_subscription_id' AND table_schema = 'public') THEN
        ALTER TABLE public.users ADD COLUMN kofi_subscription_id VARCHAR(255);
        RAISE NOTICE 'Added kofi_subscription_id column';
    END IF;

    -- Add kofi_email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kofi_email' AND table_schema = 'public') THEN
        ALTER TABLE public.users ADD COLUMN kofi_email VARCHAR(255);
        RAISE NOTICE 'Added kofi_email column';
    END IF;

    -- Add is_admin column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin' AND table_schema = 'public') THEN
        ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_admin column';
    END IF;

    -- Add account_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'account_status' AND table_schema = 'public') THEN
        ALTER TABLE public.users ADD COLUMN account_status VARCHAR(50) DEFAULT 'active';
        RAISE NOTICE 'Added account_status column';
    END IF;

    -- Add last_login_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login_at' AND table_schema = 'public') THEN
        ALTER TABLE public.users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_login_at column';
    END IF;
END $$;

-- Create admin_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id),
    admin_email VARCHAR(255),
    action_type VARCHAR(100) NOT NULL,
    target_user_id UUID,
    target_user_email VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    payment_source VARCHAR(50),
    payment_id VARCHAR(255),
    status VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set admin for admin@dataleash.io (update with your actual email)
UPDATE public.users SET is_admin = TRUE WHERE email = 'admin@dataleash.io';

-- Confirm completion
SELECT 
    column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
