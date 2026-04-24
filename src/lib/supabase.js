import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage adapter that bypasses the buggy Web Locks API entirely.
// This is essential for stability when multiple tabs are open.
const customStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

let supabase;

try {
  supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIn0.signature', // Dummy JWT
    {
      auth: {
        storage: customStorage,
        storageKey: 'fundtrack-v6', // Fresh start
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );
} catch (err) {
  console.error('Supabase initialization crash:', err);
  // Export a dummy object to prevent 'cannot read property auth of undefined' errors
  supabase = { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) } };
}

export { supabase };
