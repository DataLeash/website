-- Add subscription tier to users table
-- Run this in Supabase SQL Editor

-- Add tier column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'tier'
    ) THEN
        ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise'));
    END IF;
END $$;

-- Add subscription dates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'tier_started_at'
    ) THEN
        ALTER TABLE users ADD COLUMN tier_started_at TIMESTAMPTZ;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'tier_expires_at'
    ) THEN
        ALTER TABLE users ADD COLUMN tier_expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- To manually upgrade a user after PayPal payment verification:
-- UPDATE users SET tier = 'pro', tier_started_at = NOW(), tier_expires_at = NOW() + INTERVAL '1 month' WHERE email = 'user@example.com';

-- To downgrade a user:
-- UPDATE users SET tier = 'free', tier_expires_at = NULL WHERE email = 'user@example.com';
