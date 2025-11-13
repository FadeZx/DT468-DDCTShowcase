-- Storage policies for the project-files bucket (images/videos need public read access)
-- Safe to run multiple times

-- Ensure bucket exists (no-op if it already does)
insert into storage.buckets (id, name, public)
select 'project-files', 'project-files', false
where not exists (select 1 from storage.buckets where id = 'project-files');

alter table storage.objects enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'project_files_public_download'
  ) then
    create policy project_files_public_download
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'project-files');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'project_files_authenticated_upload'
  ) then
    create policy project_files_authenticated_upload
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'project-files');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'project_files_authenticated_update'
  ) then
    create policy project_files_authenticated_update
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'project-files')
      with check (bucket_id = 'project-files');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'project_files_authenticated_delete'
  ) then
    create policy project_files_authenticated_delete
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'project-files');
  end if;
end $$;
