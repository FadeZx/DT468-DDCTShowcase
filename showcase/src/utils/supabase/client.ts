import { createClient } from '@supabase/supabase-js';

// Read from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  const hint = [
    'Missing Supabase config. Create d:/Capt/DT468-DDCTShowcase/showcase/.env.local with:',
    '  VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co',
    '  VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY',
    'Then stop and restart the dev server (npm run dev).'
  ].join('\n');
  throw new Error(hint);
}

// Create a single Supabase client instance for the whole app
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  // Ensure the `apikey` header is always sent
  global: {
    headers: {
      apikey: supabaseAnonKey
    }
  }
});

export default supabase;