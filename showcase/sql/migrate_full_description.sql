-- Migrate projects table to use a single HTML description column.
-- 1. Add the new column if it does not exist.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS full_description text;

-- 2. Backfill from the legacy columns.
UPDATE public.projects
SET full_description = COALESCE(description_html, long_description, full_description)
WHERE full_description IS NULL;

-- 3. Drop legacy columns once data is moved.
ALTER TABLE public.projects
  DROP COLUMN IF EXISTS description_html,
  DROP COLUMN IF EXISTS long_description;
