-- Migration to align with app: remove project_type and status; keep visibility only
alter table if exists public.projects
  drop column if exists project_type;

alter table if exists public.projects
  drop column if exists status;

-- Optional data backfill examples (no-ops if columns already dropped)
-- update public.projects set visibility = 'public' where visibility is null;
