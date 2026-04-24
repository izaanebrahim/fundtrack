import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single client instance.
// Using a custom storage key to permanently bypass any previously corrupted Web Locks in the browser.
// Note: We provide fallback empty strings to prevent the library from crashing during build/SSR if env vars are missing.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      storageKey: 'fundtrack-auth-v4',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
