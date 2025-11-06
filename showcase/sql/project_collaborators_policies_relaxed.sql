-- Additional, more permissive RLS policies for project_collaborators
-- Use if owners are not the only people who should manage members.
-- These policies allow existing collaborators on a project to manage the list too.

-- Optional: set a default for invited_by so clients don't need to supply it
alter table public.project_collaborators
  alter column invited_by set default auth.uid();

-- INSERT: owner OR existing collaborator on this project OR admin
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_collaborators'
      and policyname = 'collab_insert_owner_or_collaborator'
  ) then
    create policy collab_insert_owner_or_collaborator
      on public.project_collaborators
      for insert
      to authenticated
      with check (
        exists (
          select 1 from public.projects p
          where p.id = project_id and (
            p.owner_id = auth.uid()
            or exists (
              select 1 from public.project_collaborators pc
              where pc.project_id = p.id and pc.user_id = auth.uid()
            )
            or exists (
              select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
            )
          )
        )
      );
  end if;
end $$;

-- UPDATE: owner OR existing collaborator OR admin
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_collaborators'
      and policyname = 'collab_update_owner_or_collaborator'
  ) then
    create policy collab_update_owner_or_collaborator
      on public.project_collaborators
      for update
      to authenticated
      using (
        exists (
          select 1 from public.projects p
          where p.id = project_id and (
            p.owner_id = auth.uid()
            or exists (
              select 1 from public.project_collaborators pc
              where pc.project_id = p.id and pc.user_id = auth.uid()
            )
            or exists (
              select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
            )
          )
        )
      )
      with check (
        exists (
          select 1 from public.projects p
          where p.id = project_id and (
            p.owner_id = auth.uid()
            or exists (
              select 1 from public.project_collaborators pc
              where pc.project_id = p.id and pc.user_id = auth.uid()
            )
            or exists (
              select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
            )
          )
        )
      );
  end if;
end $$;

-- DELETE: owner OR existing collaborator OR admin (still prevent deleting owner)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_collaborators'
      and policyname = 'collab_delete_owner_or_collaborator'
  ) then
    create policy collab_delete_owner_or_collaborator
      on public.project_collaborators
      for delete
      to authenticated
      using (
        exists (
          select 1 from public.projects p
          where p.id = project_id and (
            p.owner_id = auth.uid()
            or exists (
              select 1 from public.project_collaborators pc
              where pc.project_id = p.id and pc.user_id = auth.uid()
            )
            or exists (
              select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
            )
          )
        )
        and user_id is distinct from (select p.owner_id from public.projects p where p.id = project_id)
      );
  end if;
end $$;

