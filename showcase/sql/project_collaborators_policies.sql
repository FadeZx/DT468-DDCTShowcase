-- project_collaborators RLS policies
-- Run this in the Supabase SQL Editor. Idempotent creation using pg_policies.policyname.

-- 1) Ensure RLS is enabled
alter table public.project_collaborators enable row level security;

-- 2) Allow authenticated users to read collaborators (adjust later if needed)
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

-- 3) Insert: only project owner or admin
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
          select 1
          from public.projects p
          where p.id = project_id
            and (
              p.owner_id = auth.uid()
              or exists (
                select 1 from public.profiles pr
                where pr.id = auth.uid()
                  and pr.role = 'admin'
              )
            )
        )
      );
  end if;
end $$;

-- 4) Update: only project owner or admin
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
          select 1
          from public.projects p
          where p.id = project_id
            and (
              p.owner_id = auth.uid()
              or exists (
                select 1 from public.profiles pr
                where pr.id = auth.uid()
                  and pr.role = 'admin'
              )
            )
        )
      )
      with check (
        exists (
          select 1
          from public.projects p
          where p.id = project_id
            and (
              p.owner_id = auth.uid()
              or exists (
                select 1 from public.profiles pr
                where pr.id = auth.uid()
                  and pr.role = 'admin'
              )
            )
        )
      );
  end if;
end $$;

-- 5) Delete: only project owner or admin, and never delete the owner (if ever present here)
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
        -- must be owner or admin for this project
        exists (
          select 1
          from public.projects p
          where p.id = project_id
            and (
              p.owner_id = auth.uid()
              or exists (
                select 1 from public.profiles pr
                where pr.id = auth.uid()
                  and pr.role = 'admin'
              )
            )
        )
        -- cannot delete the owner if ever inserted in this table
        and (
          user_id is distinct from (
            select p.owner_id from public.projects p where p.id = project_id
          )
        )
      );
  end if;
end $$;

-- Optional stricter read policy (replace collab_select_auth with this to restrict reads)
-- create policy collab_select_public_or_participant
--   on public.project_collaborators
--   for select
--   to authenticated
--   using (
--     exists (
--       select 1 from public.projects p
--       where p.id = project_id
--         and (
--           p.visibility = 'public'
--           or p.owner_id = auth.uid()
--           or exists (
--             select 1 from public.project_collaborators pc2
--             where pc2.project_id = p.id and pc2.user_id = auth.uid()
--           )
--         )
--     )
--   );

