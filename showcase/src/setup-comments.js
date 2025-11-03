// Script to create the comments table
// Usage: node src/setup-comments.js

// Load .env if present (optional)
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) {
        const key = m[1];
        let value = m[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
} catch {}

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createCommentsTable() {
  try {
    console.log('Creating comments table...');
    
    // Create the comments table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- === PROJECT_COMMENTS ===
        create table if not exists public.project_comments (
          id uuid primary key default gen_random_uuid(),
          project_id uuid references public.projects(id) on delete cascade,
          user_id uuid references public.profiles(id) on delete cascade,
          parent_id uuid references public.project_comments(id) on delete cascade,
          content text not null,
          is_edited boolean default false,
          created_at timestamptz default now(),
          updated_at timestamptz default now()
        );

        alter table public.project_comments enable row level security;

        drop policy if exists "Comments public read" on public.project_comments;
        create policy "Comments public read" on public.project_comments for select using (true);

        drop policy if exists "Comments auth insert" on public.project_comments;
        create policy "Comments auth insert" on public.project_comments
        for insert
        with check (auth.uid() = user_id);

        drop policy if exists "Comments owner update" on public.project_comments;
        create policy "Comments owner update" on public.project_comments
        for update using (auth.uid() = user_id);

        drop policy if exists "Comments owner delete" on public.project_comments;
        create policy "Comments owner delete" on public.project_comments
        for delete using (auth.uid() = user_id);

        drop policy if exists "Comments admin delete" on public.project_comments;
        create policy "Comments admin delete" on public.project_comments
        for delete using (
          exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
        );
      `
    });

    if (error) {
      console.error('Error creating comments table:', error);
      process.exit(1);
    }

    console.log('Comments table created successfully!');
  } catch (e) {
    console.error('Failed to create comments table:', e);
    process.exit(1);
  }
}

createCommentsTable();