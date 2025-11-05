// One-time seeding script to create required accounts and profiles
// Usage: node src/setup-admin.js (with env SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
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

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // service_role key

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function upsertProfile(row) {
  const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

async function ensureUser({ email, password, metadata }) {
  // 1) Try to find existing user by email
  // Iterate over users to find by email (getUserByEmail isn't available in this SDK)
  {
    let nextPageToken = undefined;
    for (let i = 0; i < 10; i++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page: nextPageToken ? undefined : 1, perPage: 1000, nextPageToken });
      if (error) break;
      const found = data?.users?.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
      if (found) return found.id;
      nextPageToken = data?.nextPageToken;
      if (!nextPageToken) break;
    }
  }
  // 2) Try to create
  try {
    const res = await supabase.auth.admin.createUser({ email, password, user_metadata: metadata, email_confirm: true });
    const userId = res.data?.user?.id;
    if (userId) return userId;
  } catch (err) {
    const isEmailExists = (err && (err.code === 'email_exists' || err.status === 422 || String(err.message || '').includes('already been registered')));
    if (!isEmailExists) throw err;
  }
  // 3) Re-check by email (race condition or existing account)
  // Iterate over users to find by email (getUserByEmail isn't available in this SDK)
  {
    let nextPageToken = undefined;
    for (let i = 0; i < 10; i++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page: nextPageToken ? undefined : 1, perPage: 1000, nextPageToken });
      if (error) break;
      const found = data?.users?.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
      if (found) return found.id;
      nextPageToken = data?.nextPageToken;
      if (!nextPageToken) break;
    }
  }
  throw new Error('Failed to resolve user id for ' + email);
}

async function run() {
  try {
    console.log('Seeding accounts...');

    const adminId = await ensureUser({
      email: 'admin@ddct.edu.th',
      password: 'Admin#468',
      metadata: { name: 'Admin', role: 'admin', year: 'Staff' }
    });
    await upsertProfile({ id: adminId, email: 'admin@ddct.edu.th', name: 'Admin', role: 'admin', year: 'Staff', bio: '', skills: [] });

    const studentId = await ensureUser({
      email: 'student1@ddct.edu.th',
      password: 'Student#468',
      metadata: { name: 'Student One', role: 'student', year: '2568' }
    });
    await upsertProfile({ id: studentId, email: 'student1@ddct.edu.th', name: 'Student One', role: 'student', year: '2568', bio: '', skills: [] });

    const student2Id = await ensureUser({
      email: 'student2@ddct.edu.th',
      password: 'Student#468',
      metadata: { name: 'Student Two', role: 'student', year: '2568' }
    });
    await upsertProfile({ id: student2Id, email: 'student2@ddct.edu.th', name: 'Student Two', role: 'student', year: '2568', bio: '', skills: [] });

    const guestId = await ensureUser({
      email: 'guest@ddct.edu.th',
      password: 'Guest#468',
      metadata: { name: 'Guest', role: 'guest', year: '' }
    });
    await upsertProfile({ id: guestId, email: 'guest@ddct.edu.th', name: 'Guest', role: 'guest', year: '', bio: '', skills: [] });

    console.log('Done. Accounts created:');
    console.log('- admin@ddct.edu.th / Admin#468');
    console.log('- student1@ddct.edu.th / Student#468');
    console.log('- student2@ddct.edu.th / Student#468');
    console.log('- guest@ddct.edu.th / Guest#468');
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  }
}

run();