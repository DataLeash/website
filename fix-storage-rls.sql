-- Run this in Supabase SQL Editor to fix storage RLS policies
-- This fixes the "new row violates row-level security policy" error

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create a more permissive policy for authenticated uploads
CREATE POLICY "Authenticated users can upload to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'protected-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own files
CREATE POLICY "Authenticated users can read their files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'protected-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'protected-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update their files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'protected-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Make sure RLS is enabled on storage.objects (it should be by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
