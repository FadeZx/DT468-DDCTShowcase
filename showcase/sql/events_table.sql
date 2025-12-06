-- Events table for admin Events Management
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  short_description text,
  description text,
  cover_image text,
  start_at timestamptz,
  end_at timestamptz,
  location text,
  host text,
  max_attendees integer,
  category text,
  featured boolean default false,
  tags text[],
  trailer_url text,
  url text,
  visibility text not null default 'draft' check (visibility in ('draft','public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Simple trigger to keep updated_at current
create or replace function public.events_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
before update on public.events
for each row
execute function public.events_set_updated_at();
