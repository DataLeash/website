-- Add blocked_countries column to users table (Global Blocklist)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS blocked_countries TEXT[] DEFAULT '{}';

-- Add blocked_countries to file settings (stored in JSONB, so handled by app logic, but good to document)
-- No SQL needed for JSONB updates, just TypeScript types.

-- Create index for faster lookups if needed (array intersection)
CREATE INDEX IF NOT EXISTS idx_users_blocked_countries ON public.users USING GIN(blocked_countries);
