const { YahooFinance } = require('yahoo-finance2');
const yf = new YahooFinance();

async function test() {
  try {
    const symbol = '^NSEI';
    const start = '2022-01-01';
    const result = await yf.chart(symbol, {
      period1: start,
      interval: '1d',
    });
    console.log('Result keys:', Object.keys(result));
    if (result.quotes) {
      console.log('Quotes count:', result.quotes.length);
      console.log('First quote:', result.quotes[0]);
    } else {
      console.log('No quotes found in result');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
