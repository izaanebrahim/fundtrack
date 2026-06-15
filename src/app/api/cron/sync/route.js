import YahooFinance from 'yahoo-finance2';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const yf = new YahooFinance();

export async function GET(request) {
  try {
    // 1. Verify Secret Key (Supports CRON_SECRET, CRON_SECRET_KEY, or Vercel's native stripped cron header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const cronSecretKey = process.env.CRON_SECRET_KEY;
    const isVercelCronHeader = request.headers.get('x-vercel-cron') === '1' || request.headers.get('x-vercel-cron') === 'true';

    let isAuthorized = false;

    if (isVercelCronHeader) {
      isAuthorized = true;
    } else if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
    } else if (cronSecretKey && authHeader === `Bearer ${cronSecretKey}`) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      console.warn('Unauthorized cron sync attempt:', {
        hasAuthHeader: !!authHeader,
        isVercelCronHeader,
        env: process.env.NODE_ENV
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase config in cron handler');
      return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    // 2. Initialize Supabase Admin
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 3. Fetch all holdings
    const { data: holdings, error: fetchError } = await adminSupabase
      .from('holdings')
      .select('*');

    if (fetchError) throw fetchError;
    if (!holdings || holdings.length === 0) {
      return NextResponse.json({ message: 'No holdings to sync.' });
    }

    // 4. Fetch latest prices
    const symbols = holdings.map(h => h.symbol);
    const results = await Promise.all(
       symbols.map(async (symbol) => {
         if (symbol.toUpperCase() === 'CASH') return { symbol, price: 1 };
         try {
           const quote = await yf.quote(symbol);
           return { symbol, price: quote.regularMarketPrice };
         } catch (e) {
           console.error(`Error fetching price for ${symbol}:`, e);
           return { symbol, price: null };
         }
       })
    );

    // 5. Update holdings & Calculate Total AUM
    let totalFundValue = 0;
    const updates = [];
    const nowStr = new Date().toISOString();

    for (const res of results) {
      const holding = holdings.find(h => h.symbol === res.symbol);
      const priceToUse = res.price !== null ? res.price : (holding.current_price || 0);
      
      totalFundValue += holding.quantity * priceToUse;

      if (res.price !== null) {
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
      }
    }

    if (updates.length > 0) {
      const { error: updateError } = await adminSupabase
        .from('holdings')
        .upsert(updates, { onConflict: 'id' });
      if (updateError) throw updateError;
    }

    // 6. Calculate New NAV
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

    // 7. Record in History (avoiding duplicates for the same date)
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
      nav: newNav, 
      aum: totalFundValue,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
