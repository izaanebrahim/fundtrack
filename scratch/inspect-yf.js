const yahooFinance = require('yahoo-finance2');
console.log('Keys:', Object.keys(yahooFinance));
console.log('Default:', yahooFinance.default ? 'exists' : 'no');
if (yahooFinance.default) {
  console.log('Default keys:', Object.keys(yahooFinance.default));
}
