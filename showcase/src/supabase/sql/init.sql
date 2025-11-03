-- DDCT Showcase initial schema & policies (runnable end-to-end)
-- Paste into Supabase SQL Editor and Run.
-- Safe for storage policies: no ALTER ownership required.

-- === 1) PROFILES ===
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text,
  role text check (role in ('admin','student','guest')) default 'guest',
  year text,
  avatar text,
  bio text,
  skills jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles public read" on public.profiles;
create policy "Profiles public read" on public.profiles for select using (true);

drop policy if exists "Profiles self update" on public.profiles;
create policy "Profiles self update" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Profiles admin update" on public.profiles;
create policy "Profiles admin update" on public.profiles for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Allow inserts: service role can insert any; users can insert their own row
drop policy if exists "Profiles insert by service or self" on public.profiles;
create policy "Profiles insert by service or self" on public.profiles for insert with check (
  auth.role() = 'service_role' or auth.uid() = id
);

-- Allow updates via service role so upsert works on existing rows
drop policy if exists "Profiles update by service" on public.profiles;
create policy "Profiles update by service" on public.profiles for update using (
  auth.role() = 'service_role'
);


-- === 2) PROJECTS ===
create table if not exists public.projects (
  id uuid primary key,
  title text not null,
  description text,
  long_description text,
  category text,
  author_id uuid references public.profiles(id) on delete cascade,
  tags text[] default array[]::text[],
  status text check (status in ('draft','published')) default 'draft',
  price numeric default 0,
  cover_image text,
  created_at timestamptz default now()
);

alter table public.projects enable row level security;

drop policy if exists "Projects public read" on public.projects;
create policy "Projects public read" on public.projects for select using (true);

drop policy if exists "Projects student insert" on public.projects;
create policy "Projects student insert" on public.projects
for insert
with check (
  auth.uid() = author_id
  and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'student')
);

drop policy if exists "Projects owner update" on public.projects;
create policy "Projects owner update" on public.projects
for update using (auth.uid() = author_id);

drop policy if exists "Projects admin update" on public.projects;
create policy "Projects admin update" on public.projects
for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- === 3) PROJECT_FILES ===
create table if not exists public.project_files (
  id uuid primary key,
  project_id uuid references public.projects(id) on delete cascade,
  file_name text,
  file_url text,
  file_path text,
  file_type text,
  file_size bigint,
  mime_type text,
  is_cover boolean default false,
  created_at timestamptz default now()
);

alter table public.project_files enable row level security;

drop policy if exists "Project files read" on public.project_files;
create policy "Project files read" on public.project_files for select using (true);

drop policy if exists "Project files insert by owner/admin" on public.project_files;
create policy "Project files insert by owner/admin" on public.project_files
for insert
with check (
  exists (
    select 1 from projects pr
    where pr.id = project_id
      and (pr.author_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  )
);

drop policy if exists "Project files update by owner/admin" on public.project_files;
create policy "Project files update by owner/admin" on public.project_files
for update using (
  exists (
    select 1 from projects pr
    where pr.id = project_id
      and (pr.author_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  )
);

drop policy if exists "Project files delete by owner/admin" on public.project_files;
create policy "Project files delete by owner/admin" on public.project_files
for delete using (
  exists (
    select 1 from projects pr
    where pr.id = project_id
      and (pr.author_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  )
);

-- === 4) PROJECT_COLLABORATORS ===
create table if not exists public.project_collaborators (
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'collaborator',
  invited_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);

alter table public.project_collaborators enable row level security;

drop policy if exists "Collaborators read" on public.project_collaborators;
create policy "Collaborators read" on public.project_collaborators for select using (true);

drop policy if exists "Collaborators write by owner/admin" on public.project_collaborators;
create policy "Collaborators write by owner/admin" on public.project_collaborators
for insert
with check (
  exists (
    select 1 from projects pr
    where pr.id = project_id
      and (pr.author_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  )
);

drop policy if exists "Collaborators update by owner/admin" on public.project_collaborators;
create policy "Collaborators update by owner/admin" on public.project_collaborators
for update using (
  exists (
    select 1 from projects pr
    where pr.id = project_id
      and (pr.author_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  )
);

drop policy if exists "Collaborators delete by owner/admin" on public.project_collaborators;
create policy "Collaborators delete by owner/admin" on public.project_collaborators
for delete using (
  exists (
    select 1 from projects pr
    where pr.id = project_id
      and (pr.author_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  )
);

-- === 5) PROJECT_COMMENTS ===
create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  parent_id uuid references public.project_comments(id) on delete cascade,
  content text not null,
  is_edited boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.project_comments enable row level security;

drop policy if exists "Comments public read" on public.project_comments;
create policy "Comments public read" on public.project_comments for select using (true);

drop policy if exists "Comments auth insert" on public.project_comments;
create policy "Comments auth insert" on public.project_comments
for insert
with check (auth.uid() = user_id);

drop policy if exists "Comments owner update" on public.project_comments;
create policy "Comments owner update" on public.project_comments
for update using (auth.uid() = user_id);

drop policy if exists "Comments owner delete" on public.project_comments;
create policy "Comments owner delete" on public.project_comments
for delete using (auth.uid() = user_id);

drop policy if exists "Comments admin delete" on public.project_comments;
create policy "Comments admin delete" on public.project_comments
for delete using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- === 6) STORAGE BUCKET + POLICIES (safe; no ALTER on storage.objects) ===
-- Create bucket (idempotent)
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'project-files') then
    perform storage.create_bucket('project-files', public => true);
  end if;
end$$;

-- Create policies only if not exists (safe for storage.objects)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read project-files'
  ) then
    create policy "Public read project-files" on storage.objects
      for select using (bucket_id = 'project-files');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Auth insert project-files'
  ) then
    create policy "Auth insert project-files" on storage.objects
      for insert with check (auth.role() = 'authenticated' and bucket_id = 'project-files');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Auth update project-files'
  ) then
    create policy "Auth update project-files" on storage.objects
      for update using (auth.role() = 'authenticated' and bucket_id = 'project-files');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Auth delete project-files'
  ) then
    create policy "Auth delete project-files" on storage.objects
      for delete using (auth.role() = 'authenticated' and bucket_id = 'project-files');
  end if;
end$$;

-- Allow updates via service role so upsert works on existing rows
drop policy if exists "Profiles update by service" on public.profiles;
create policy "Profiles update by service" on public.profiles for update using (
  auth.role() = 'service_role'
);