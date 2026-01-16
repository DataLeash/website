-- Add PayPal subscription ID column to users table
-- Run this in Supabase SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_paypal_subscription_id 
ON users(paypal_subscription_id);
