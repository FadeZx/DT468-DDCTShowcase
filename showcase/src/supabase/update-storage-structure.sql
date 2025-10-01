-- Update storage bucket structure for organized file storage
-- This script sets up the proper folder structure and policies

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Update storage policies for the new structure
DROP POLICY IF EXISTS "Users can upload project files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their project files" ON storage.objects;

-- Create new policies for organized structure
CREATE POLICY "Users can upload project files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view project files" ON storage.objects
FOR SELECT USING (bucket_id = 'project-files');

CREATE POLICY "Users can update their project files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their project files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to generate proper file paths
CREATE OR REPLACE FUNCTION generate_file_path(
  project_id TEXT,
  file_type TEXT,
  file_id TEXT,
  file_extension TEXT
) RETURNS TEXT AS $$
BEGIN
  CASE file_type
    WHEN 'image' THEN
      RETURN 'projects/' || project_id || '/images/originals/' || file_id || '.' || file_extension;
    WHEN 'thumbnail' THEN
      RETURN 'projects/' || project_id || '/images/thumbs/' || file_id || '_320.' || file_extension;
    WHEN 'document' THEN
      RETURN 'projects/' || project_id || '/docs/' || file_id || '.' || file_extension;
    WHEN 'project' THEN
      RETURN 'projects/' || project_id || '/docs/' || file_id || '.' || file_extension;
    WHEN 'export' THEN
      RETURN 'projects/' || project_id || '/exports/' || extract(epoch from now()) || '-' || file_type || '.pdf';
    ELSE
      RETURN 'projects/' || project_id || '/tmp/' || file_id || '.' || file_extension;
  END CASE;
END;
$$ LANGUAGE plpgsql;