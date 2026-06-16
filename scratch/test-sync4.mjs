
import { createClient } from '@supabase/supabase-js';
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  const { error } = await adminSupabase.from('fund').insert([{
        date: '2026-04-30',
        total_value: 100,
        total_units: 10,
        nav: 10
      }]);
  console.log('Insert duplicate error:', error);
}
run();

