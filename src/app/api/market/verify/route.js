// Importing and initializing the YahooFinance client correctly for v2
import YahooFinance from 'yahoo-finance2';
import { NextResponse } from 'next/server';

const yf = new YahooFinance();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  // Handle CASH as a special internal symbol
  if (symbol.toUpperCase() === 'CASH') {
    return NextResponse.json({
      success: true,
      symbol: 'CASH',
      name: 'Cash / Liquid Funds',
      price: 1
    });
  }

  try {
    const quote = await yf.quote(symbol);
    
    if (!quote || (!quote.regularMarketPrice && !quote.longName)) {
       return NextResponse.json({ error: 'Symbol not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      symbol: quote.symbol,
      name: quote.longName || quote.shortName || symbol,
      price: quote.regularMarketPrice
    });

  } catch (error) {
    console.error('Verify Symbol Error:', error);
    return NextResponse.json({ error: 'Invalid symbol or market data unavailable' }, { status: 404 });
  }
}
