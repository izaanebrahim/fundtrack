import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single client instance.
// Using a custom storage key to permanently bypass any previously corrupted Web Locks in the browser.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'fundtrack-auth-v4',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
