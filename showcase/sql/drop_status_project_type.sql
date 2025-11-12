-- Migration: drop redundant columns from projects
alter table if exists public.projects
  drop column if exists project_type,
  drop column if exists status;

-- Optional: if any views or triggers depend on these, update them accordingly.
