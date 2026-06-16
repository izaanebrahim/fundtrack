
import { createClient } from '@supabase/supabase-js';
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  const { data, error } = await adminSupabase.from('fund').delete().eq('total_value', 100).eq('nav', 10);
  console.log('Deleted dummy entry');
}
run();

