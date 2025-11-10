-- Allow owners and admins to delete projects (fixes silent RLS-blocked deletes)
-- Safe to run multiple times

alter table public.projects enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects' and policyname = 'Projects owner delete'
  ) then
    create policy "Projects owner delete"
      on public.projects
      for delete
      to authenticated
      using (owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects' and policyname = 'Projects admin delete'
  ) then
    create policy "Projects admin delete"
      on public.projects
      for delete
      to authenticated
      using (exists (
        select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'
      ));
  end if;
end $$;

-- Optional: allow collaborators to delete too (commented by default)
-- create policy "Projects collaborator delete"
--   on public.projects
--   for delete
--   to authenticated
--   using (exists (
--     select 1 from public.project_collaborators pc
--     where pc.project_id = id and pc.user_id = auth.uid()
--   ));

