import YahooFinance from 'yahoo-finance2';
import { NextResponse } from 'next/server';

const yf = new YahooFinance();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || '^NSEI';
  const start = searchParams.get('start');

  if (!start) {
    return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
  }

  try {
    // We use chart() because historical() is being deprecated/mapped to chart internally
    const result = await yf.chart(symbol, {
      period1: start,
      interval: '1d',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Benchmark API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
