
import { createClient } from '@supabase/supabase-js';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: holdings, error: fetchError } = await adminSupabase
    .from('holdings')
    .select('*');

  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }
  console.log('Holdings count:', holdings?.length);

  const symbols = holdings.map(h => h.symbol);
  console.log('Symbols:', symbols);

  const results = await Promise.all(
     symbols.map(async (symbol) => {
       if (symbol.toUpperCase() === 'CASH') return { symbol, price: 1 };
       try {
         const quote = await yf.quote(symbol);
         return { symbol, price: quote.regularMarketPrice };
       } catch (e) {
         console.error('Error fetching price for', symbol, ':', e.message);
         return { symbol, price: null };
       }
     })
  );

  console.log('Results:', results);
}
run();

