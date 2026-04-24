import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Singleton pattern to prevent "navigator lock" errors in development
let supabase;

if (typeof window !== 'undefined') {
  // Browser: Cache the client on the window object to survive HMR reloads
  if (!window.__supabaseClient) {
    window.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  supabase = window.__supabaseClient;
} else {
  // Server: Just create a new client
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
