-- Members-manage collaborators safely (non-recursive) + job_role support
-- 1) Schema adjustments
alter table public.project_collaborators
  add column if not exists job_role text,
  alter column invited_by set default auth.uid();

-- 2) Helper function to check membership without RLS recursion
create or replace function public.is_project_collaborator(p_project_id uuid, p_user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_exists boolean;
begin
  select exists(
    select 1 from public.project_collaborators pc
    where pc.project_id = p_project_id and pc.user_id = p_user_id
  ) into v_exists;
  return coalesce(v_exists, false);
end;
$$;

revoke all on function public.is_project_collaborator(uuid, uuid) from public;
grant execute on function public.is_project_collaborator(uuid, uuid) to authenticated, anon;

-- 3) RLS: allow owner OR collaborator OR admin to write; prevent deleting owner row
alter table public.project_collaborators enable row level security;

-- Drop conflicting policies if present
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='project_collaborators' and policyname='collab_select_auth')
  then drop policy "collab_select_auth" on public.project_collaborators; end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='project_collaborators' and policyname='collab_insert_owner_or_admin')
  then drop policy "collab_insert_owner_or_admin" on public.project_collaborators; end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='project_collaborators' and policyname='collab_update_owner_or_admin')
  then drop policy "collab_update_owner_or_admin" on public.project_collaborators; end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='project_collaborators' and policyname='collab_delete_owner_or_admin')
  then drop policy "collab_delete_owner_or_admin" on public.project_collaborators; end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='project_collaborators' and policyname='collab_insert_owner_or_collaborator')
  then drop policy "collab_insert_owner_or_collaborator" on public.project_collaborators; end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='project_collaborators' and policyname='collab_update_owner_or_collaborator')
  then drop policy "collab_update_owner_or_collaborator" on public.project_collaborators; end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='project_collaborators' and policyname='collab_delete_owner_or_collaborator')
  then drop policy "collab_delete_owner_or_collaborator" on public.project_collaborators; end if;
end $$;

-- Read
create policy collab_select_auth
  on public.project_collaborators
  for select
  to authenticated
  using (true);

-- Insert
create policy collab_insert_owner_or_member
  on public.project_collaborators
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (
        p.owner_id = auth.uid()
        or public.is_project_collaborator(project_id, auth.uid())
        or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
      )
    )
  );

-- Update
create policy collab_update_owner_or_member
  on public.project_collaborators
  for update
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (
        p.owner_id = auth.uid()
        or public.is_project_collaborator(project_id, auth.uid())
        or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
      )
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (
        p.owner_id = auth.uid()
        or public.is_project_collaborator(project_id, auth.uid())
        or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
      )
    )
  );

-- Delete (block deleting owner row)
create policy collab_delete_owner_or_member
  on public.project_collaborators
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (
        p.owner_id = auth.uid()
        or public.is_project_collaborator(project_id, auth.uid())
        or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
      )
    )
    and user_id is distinct from (select p.owner_id from public.projects p where p.id = project_id)
  );

