const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance();

async function test() {
  try {
    const symbol = '^NSEI';
    const start = '2022-01-01';
    console.log('Fetching for symbol:', symbol, 'start:', start);
    const result = await yf.chart(symbol, {
      period1: start,
      interval: '1d',
    });
    console.log('Result keys:', Object.keys(result));
    if (result.quotes) {
      console.log('Quotes count:', result.quotes.length);
      console.log('Sample quote:', result.quotes[0]);
    } else {
      console.log('No quotes found in result');
      console.log('Full result:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

test();
