-- Create storage buckets for project files
-- Run this in your Supabase SQL Editor

-- Create the project-files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed',
    'application/pdf',
    'text/plain',
    'application/json',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav'
  ]
);

-- Create storage policies for project-files bucket

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload project files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files');

-- Policy: Allow public read access to project files
CREATE POLICY "Allow public read access to project files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-files');

-- Policy: Allow users to update their own files
CREATE POLICY "Allow users to update their own project files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow users to delete their own files
CREATE POLICY "Allow users to delete their own project files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Alternative: If the above policies don't work, use these simpler ones:

-- Simple policy: Allow all authenticated users to manage files
-- CREATE POLICY "Allow authenticated users full access to project files"
-- ON storage.objects
-- FOR ALL
-- TO authenticated
-- USING (bucket_id = 'project-files')
-- WITH CHECK (bucket_id = 'project-files');

-- Simple policy: Allow public read access
-- CREATE POLICY "Allow public read access to project files"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'project-files');