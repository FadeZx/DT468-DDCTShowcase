-- Run this SQL in your Supabase SQL Editor to create the comments table

-- === PROJECT_COMMENTS ===
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

-- === PROJECT_LIKES ===
create table if not exists public.project_likes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(project_id, user_id)
);

alter table public.project_likes enable row level security;

drop policy if exists "Project likes public read" on public.project_likes;
create policy "Project likes public read" on public.project_likes for select using (true);

drop policy if exists "Project likes auth insert" on public.project_likes;
create policy "Project likes auth insert" on public.project_likes
for insert
with check (auth.uid() = user_id);

drop policy if exists "Project likes owner delete" on public.project_likes;
create policy "Project likes owner delete" on public.project_likes
for delete using (auth.uid() = user_id);

-- === COMMENT_LIKES ===
create table if not exists public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid references public.project_comments(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);

alter table public.comment_likes enable row level security;

drop policy if exists "Comment likes public read" on public.comment_likes;
create policy "Comment likes public read" on public.comment_likes for select using (true);

drop policy if exists "Comment likes auth insert" on public.comment_likes;
create policy "Comment likes auth insert" on public.comment_likes
for insert
with check (auth.uid() = user_id);

drop policy if exists "Comment likes owner delete" on public.comment_likes;
create policy "Comment likes owner delete" on public.comment_likes
for delete using (auth.uid() = user_id);