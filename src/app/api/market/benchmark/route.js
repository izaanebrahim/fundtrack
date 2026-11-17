import YahooFinance from 'yahoo-finance2';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || '^NSEI';
  const start = searchParams.get('start');

  if (!start) {
    return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
  }

  try {
    const yf = new YahooFinance();
    const result = await yf.chart(symbol, {
      period1: start,
      interval: '1d',
    });

    // yahoo-finance2 v3 returns quotes directly in result.quotes
    const quotes = result?.quotes || [];
    const normalized = quotes
      .filter(q => q.close != null)
      .map(q => ({
        date: new Date(q.date).toISOString(),
        close: q.close,
      }));

    return NextResponse.json({ quotes: normalized });
  } catch (error) {
    console.error('Benchmark API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
