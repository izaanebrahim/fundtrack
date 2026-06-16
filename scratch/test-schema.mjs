
import { createClient } from '@supabase/supabase-js';
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function run() {
  // Let's insert a duplicate date manually to see if it fails
  const { error } = await adminSupabase.from('fund').insert([{
    date: '2026-04-30',
    total_value: 1,
    total_units: 1,
    nav: 1
  }]);
  console.log('Error on duplicate insert:', error);
}
run();

