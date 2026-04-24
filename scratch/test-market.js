const yahooFinance = require('yahoo-finance2').default;

async function test() {
  const symbols = ['RELIANCE.NS', 'TATAMOTORS.NS', 'SUZLON.NS', 'AAPL'];
  
  console.log('--- Testing Yahoo Finance Connectivity ---');
  
  for (const symbol of symbols) {
    try {
      console.log(`Fetching ${symbol}...`);
      // In v2, we might need to use basic quote directly or check if static usage is disabled.
      // But let's try calling it correctly.
      const quote = await yahooFinance.quote(symbol);
      console.log(`✅ Success! [${symbol}] Name: ${quote.longName || quote.shortName}, Price: ${quote.regularMarketPrice}`);
    } catch (error) {
      console.error(`❌ Failed! [${symbol}] Error Content:`, error.message);
    }
  }
}

test();
