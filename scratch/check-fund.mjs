import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('fund')
    .select('*')
    .order('date', { ascending: false });
  console.log('Fund rows count:', data?.length);
  console.log('Latest 10 rows:', data?.slice(0, 10));
}
check();
