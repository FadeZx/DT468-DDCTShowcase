-- Fix infinite recursion in project_collaborators RLS policies
-- Removes recursive policies and reinstates owner/admin-only write access.

-- Optional: keep default for invited_by so clients don't need to send it
alter table public.project_collaborators
  alter column invited_by set default auth.uid();

-- Drop the relaxed (recursive) policies if they exist
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_collaborators'
      and policyname = 'collab_insert_owner_or_collaborator'
  ) then
    drop policy "collab_insert_owner_or_collaborator" on public.project_collaborators;
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_collaborators'
      and policyname = 'collab_update_owner_or_collaborator'
  ) then
    drop policy "collab_update_owner_or_collaborator" on public.project_collaborators;
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_collaborators'
      and policyname = 'collab_delete_owner_or_collaborator'
  ) then
    drop policy "collab_delete_owner_or_collaborator" on public.project_collaborators;
  end if;
end $$;

-- Ensure RLS is enabled
alter table public.project_collaborators enable row level security;

-- Read for authenticated users (adjust later if you want to restrict)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_collaborators'
      and policyname = 'collab_select_auth'
  ) then
    create policy collab_select_auth
      on public.project_collaborators
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- INSERT: only project owner or admin (non-recursive; references projects only)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_collaborators'
      and policyname = 'collab_insert_owner_or_admin'
  ) then
    create policy collab_insert_owner_or_admin
      on public.project_collaborators
      for insert
      to authenticated
      with check (
        exists (
          select 1 from public.projects p
          where p.id = project_id
            and (
              p.owner_id = auth.uid()
              or exists (
                select 1 from public.profiles pr
                where pr.id = auth.uid() and pr.role = 'admin'
              )
            )
        )
      );
  end if;
end $$;

-- UPDATE: only project owner or admin (non-recursive)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_collaborators'
      and policyname = 'collab_update_owner_or_admin'
  ) then
    create policy collab_update_owner_or_admin
      on public.project_collaborators
      for update
      to authenticated
      using (
        exists (
          select 1 from public.projects p
          where p.id = project_id
            and (
              p.owner_id = auth.uid()
              or exists (
                select 1 from public.profiles pr
                where pr.id = auth.uid() and pr.role = 'admin'
              )
            )
        )
      )
      with check (
        exists (
          select 1 from public.projects p
          where p.id = project_id
            and (
              p.owner_id = auth.uid()
              or exists (
                select 1 from public.profiles pr
                where pr.id = auth.uid() and pr.role = 'admin'
              )
            )
        )
      );
  end if;
end $$;

-- DELETE: only project owner or admin, and never delete owner row if present
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_collaborators'
      and policyname = 'collab_delete_owner_or_admin'
  ) then
    create policy collab_delete_owner_or_admin
      on public.project_collaborators
      for delete
      to authenticated
      using (
        exists (
          select 1 from public.projects p
          where p.id = project_id
            and (
              p.owner_id = auth.uid()
              or exists (
                select 1 from public.profiles pr
                where pr.id = auth.uid() and pr.role = 'admin'
              )
            )
        )
        and user_id is distinct from (
          select p.owner_id from public.projects p where p.id = project_id
        )
      );
  end if;
end $$;

