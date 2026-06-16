
import { createClient } from '@supabase/supabase-js';
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  const { data, error } = await adminSupabase.from('fund').select('*').order('date', { ascending: false }).limit(5);
  console.log('Fund data:', data, 'Error:', error);
}
run();

