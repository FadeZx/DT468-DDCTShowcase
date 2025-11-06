-- RLS for project_comments so authors, owners, collaborators, and admins can delete

-- 1) Enable RLS
alter table public.project_comments enable row level security;

-- 2) Select: allow authenticated read (adjust if needed)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_comments'
      and policyname = 'comments_select_auth'
  ) then
    create policy comments_select_auth
      on public.project_comments
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- 3) Insert: allow authenticated users (or tighten as needed)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_comments'
      and policyname = 'comments_insert_auth'
  ) then
    create policy comments_insert_auth
      on public.project_comments
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;
end $$;

-- 4) Update: only author can update their own comment
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_comments'
      and policyname = 'comments_update_author'
  ) then
    create policy comments_update_author
      on public.project_comments
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;

-- 5) Delete: author OR project owner OR collaborator OR admin
-- Uses helper public.is_project_collaborator(project_id, uid) we created earlier
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_comments'
      and policyname = 'comments_delete_author_or_project_staff'
  ) then
    create policy comments_delete_author_or_project_staff
      on public.project_comments
      for delete
      to authenticated
      using (
        -- Comment author
        user_id = auth.uid()
        or
        -- Project owner
        exists (
          select 1 from public.projects p
          where p.id = project_id and p.owner_id = auth.uid()
        )
        or
        -- Collaborator on this project
        public.is_project_collaborator(project_id, auth.uid())
        or
        -- Admin
        exists (
          select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
        )
      );
  end if;
end $$;

