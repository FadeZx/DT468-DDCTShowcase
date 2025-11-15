-- Normalize visibility to only 'public' or 'unlisted'.
UPDATE public.projects
SET visibility = 'unlisted'
WHERE visibility IS NULL
   OR visibility IN ('draft', 'private', '');

ALTER TABLE public.projects
  ALTER COLUMN visibility SET DEFAULT 'unlisted';

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_visibility_check,
  ADD CONSTRAINT projects_visibility_check CHECK (visibility = ANY (ARRAY['unlisted', 'public']));
