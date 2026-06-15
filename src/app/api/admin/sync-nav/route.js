import YahooFinance from 'yahoo-finance2';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const yf = new YahooFinance();

export async function POST(request) {
  try {
    // Use Service Role to bypass RLS and see all holdings for the valuation
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch all holdings from the database
    const { data: holdings, error: fetchError } = await adminSupabase
      .from('holdings')
      .select('*');

    if (fetchError) throw fetchError;
    if (!holdings || holdings.length === 0) {
      return NextResponse.json({ error: 'No holdings found to sync.' }, { status: 400 });
    }

    // 2. Fetch latest prices for all symbols
    const symbols = holdings.map(h => h.symbol);
    const results = await Promise.all(
       symbols.map(async (symbol) => {
         if (symbol.toUpperCase() === 'CASH') {
           return { symbol, price: 1 };
         }
         try {
           const quote = await yf.quote(symbol);
           return { symbol, price: quote.regularMarketPrice };
         } catch (e) {
           console.error(`Error fetching price for ${symbol}:`, e);
           return { symbol, price: null };
         }
       })
    );

    // 3. Update holdings with new prices
    let totalFundValue = 0;
    const updates = [];
    const nowStr = new Date().toISOString();

    for (const res of results) {
      const holding = holdings.find(h => h.symbol === res.symbol);
      if (res.price !== null) {
        totalFundValue += holding.quantity * res.price;
        updates.push({
          id: holding.id,
          symbol: holding.symbol,
          name: holding.name,
          category: holding.category,
          sector: holding.sector,
          quantity: holding.quantity,
          avg_cost: holding.avg_cost,
          current_price: res.price,
          last_synced_at: nowStr
        });
      } else {
         // If price fetch failed, use old price for valuation
         totalFundValue += holding.quantity * (holding.current_price || 0);
      }
    }

    if (updates.length > 0) {
      const { error: updateError } = await adminSupabase
        .from('holdings')
        .upsert(updates, { onConflict: 'id' });
      if (updateError) throw updateError;
    }

    // 4. Calculate New NAV
    // Sum all circulating units
    const { data: transactions } = await adminSupabase
      .from('transactions')
      .select('type, units');
    
    let totalUnits = 0;
    if (transactions) {
      transactions.forEach(t => {
        if (t.type === 'INVEST') totalUnits += Number(t.units);
        else if (t.type === 'WITHDRAW') totalUnits -= Number(t.units);
      });
    }

    const newNav = totalUnits > 0 ? (totalFundValue / totalUnits) : 10;

    // 5. Record final result in Fund history (avoiding duplicates for the same date)
    const todayStr = new Date().toISOString().split('T')[0];
    
    const { data: existingFundRows } = await adminSupabase
      .from('fund')
      .select('id')
      .eq('date', todayStr)
      .limit(1);

    if (existingFundRows && existingFundRows.length > 0) {
      const { error: fundError } = await adminSupabase
        .from('fund')
        .update({
          total_value: totalFundValue,
          total_units: totalUnits,
          nav: newNav
        })
        .eq('id', existingFundRows[0].id);
      if (fundError) throw fundError;
    } else {
      const { error: fundError } = await adminSupabase
        .from('fund')
        .insert([{
          date: todayStr,
          total_value: totalFundValue,
          total_units: totalUnits,
          nav: newNav
        }]);
      if (fundError) throw fundError;
    }

    return NextResponse.json({ 
      success: true, 
      totalValue: totalFundValue, 
      nav: newNav, 
      units: totalUnits 
    });

  } catch (error) {
    console.error('Sync API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
