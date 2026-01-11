-- Add anonymous_id column to users table
-- Run this in Supabase SQL Editor

-- 1. Add the column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS anonymous_id VARCHAR(10) UNIQUE;

-- 2. Create function to generate anonymous ID
CREATE OR REPLACE FUNCTION generate_anonymous_id()
RETURNS VARCHAR(10) AS $$
DECLARE
    new_id VARCHAR(10);
    done BOOLEAN;
BEGIN
    done := FALSE;
    WHILE NOT done LOOP
        -- Generate DL-XXXXXX format (6 random hex chars)
        new_id := 'DL-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        -- Check if unique
        done := NOT EXISTS (SELECT 1 FROM public.users WHERE anonymous_id = new_id);
    END LOOP;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Backfill existing users who don't have an anonymous_id
UPDATE public.users 
SET anonymous_id = generate_anonymous_id() 
WHERE anonymous_id IS NULL;

-- 4. Create trigger to auto-generate for new users
CREATE OR REPLACE FUNCTION set_anonymous_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.anonymous_id IS NULL THEN
        NEW.anonymous_id := generate_anonymous_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_anonymous_id ON public.users;
CREATE TRIGGER trigger_set_anonymous_id
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION set_anonymous_id();

-- 5. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_anonymous_id ON public.users(anonymous_id);
