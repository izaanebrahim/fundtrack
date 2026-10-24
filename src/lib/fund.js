import { supabase } from './supabase';

// Total units issued by the fund (invested minus withdrawn, across all clients).
// Comes from a database function so client pages never read other clients'
// transactions. See supabase/migrations/20261024_client_privacy.sql.
export async function fetchFundUnits() {
  const { data, error } = await supabase.rpc('fund_total_units');
  if (!error) return Number(data) || 0;

  // Fallback until the migration has been run: sum the transactions directly
  const { data: txs, error: txError } = await supabase.from('transactions').select('type, units');
  if (txError) throw txError;
  return (txs || []).reduce((sum, t) => {
    if (t.type === 'INVEST') return sum + Number(t.units);
    if (t.type === 'WITHDRAW') return sum - Number(t.units);
    return sum;
  }, 0);
}
