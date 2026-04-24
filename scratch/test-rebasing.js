const { format, subMonths, subYears, isAfter } = require('date-fns');

const allHistory = [
  { date: '2024-01-01', nav: 10 },
  { date: '2024-02-01', nav: 11 },
  { date: '2024-03-01', nav: 12 },
];

const benchmarkData = [
  { date: '2023-12-31', price: 100 },
  { date: '2024-01-01', price: 101 },
  { date: '2024-02-01', price: 105 },
  { date: '2024-03-01', price: 110 },
];

let cutoffDate = null; // 'ALL' range
const filteredFund = allHistory;
const fundBase = filteredFund[0].nav;

// Find closest benchmark date for rebasing
const benchmarkVisible = benchmarkData.filter(b => isAfter(new Date(b.date), new Date(filteredFund[0].date)));
const benchmarkBase = benchmarkVisible.length > 0 ? benchmarkVisible[0].price : 0;

console.log('filteredFund[0].date:', filteredFund[0].date);
console.log('benchmarkVisible:', benchmarkVisible);
console.log('benchmarkBase:', benchmarkBase);

const chartData = filteredFund.map(f => {
  const bPoint = benchmarkData.find(b => b.date === f.date);
  const lastBPoint = bPoint || benchmarkData.filter(b => b.date <= f.date).slice(-1)[0];
  
  return {
    date: f.date,
    fund: ((f.nav / fundBase) * 100).toFixed(2),
    benchmark: (lastBPoint && benchmarkBase > 0) ? ((lastBPoint.price / benchmarkBase) * 100).toFixed(2) : null,
  };
});

console.log('chartData:', chartData);
