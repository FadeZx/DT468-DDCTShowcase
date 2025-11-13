-- Run this in the Supabase SQL editor to make project views persistent
-- Safe to re-run; guards make it idempotent

alter table if exists public.projects
  add column if not exists views bigint not null default 0;

create or replace function public.increment_project_views(p_project_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_views bigint;
begin
  update public.projects
  set views = coalesce(views, 0) + 1,
      updated_at = now()
  where id = p_project_id
  returning views into new_views;

  if new_views is null then
    raise exception 'Project % not found', p_project_id;
  end if;

  return new_views;
end;
$$;

revoke all on function public.increment_project_views(uuid) from public;
grant execute on function public.increment_project_views(uuid) to anon, authenticated;
