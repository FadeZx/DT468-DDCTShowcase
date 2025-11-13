-- Enable and configure row level security for project_likes
-- Safe to run multiple times

alter table public.project_likes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'project_likes' and policyname = 'project_likes_select_public'
  ) then
    create policy project_likes_select_public
      on public.project_likes
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'project_likes' and policyname = 'project_likes_insert_self'
  ) then
    create policy project_likes_insert_self
      on public.project_likes
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'project_likes' and policyname = 'project_likes_delete_self'
  ) then
    create policy project_likes_delete_self
      on public.project_likes
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;
