// Demo data for the public version of FundTrack.
// Everything here is generated: the people, the amounts and the fund's
// history are fictional. Prices are illustrative, not live quotes.

export const DEMO_PASSWORD = 'demo1234';

export const DEMO_ACCOUNTS = [
  { label: 'Fund manager (admin)', email: 'admin@fundtrack.demo' },
  { label: 'Investor (client)', email: 'investor@fundtrack.demo' },
];

// Small deterministic random generator so every visitor sees the same history
function mulberry32(seed) {
  return function rand() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const uid = (prefix, n) => `${prefix}-${String(n).padStart(4, '0')}-demo`;
const dayStr = (d) => d.toISOString().split('T')[0];

const CLIENTS = [
  { name: 'Aarav Mehta', email: 'investor@fundtrack.demo', phone: '9000000101' },
  { name: 'Diya Kapoor', email: 'diya@fundtrack.demo', phone: '9000000102' },
  { name: 'Rohan Iyer', email: 'rohan@fundtrack.demo', phone: '9000000103' },
  { name: 'Sara Thomas', email: 'sara@fundtrack.demo', phone: '9000000104' },
  { name: 'Kabir Shah', email: 'kabir@fundtrack.demo', phone: '9000000105' },
  { name: 'Meera Nair', email: 'meera@fundtrack.demo', phone: '9000000106' },
];

// Illustrative portfolio (weights add up to 0.95; the rest is cash)
const PORTFOLIO = [
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'Information Technology', price: 3950, weight: 0.13 },
  { symbol: 'INFY.NS', name: 'Infosys', sector: 'Information Technology', price: 1720, weight: 0.11 },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'Consumer Goods (FMCG)', price: 2480, weight: 0.10 },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries', sector: 'Healthcare & Pharma', price: 1650, weight: 0.10 },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India', sector: 'Automobile', price: 12400, weight: 0.09 },
  { symbol: 'TITAN.NS', name: 'Titan Company', sector: 'Jewellery', price: 3450, weight: 0.08 },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', sector: 'Paints & Coatings', price: 2900, weight: 0.08 },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement', sector: 'Cement & Building Materials', price: 11200, weight: 0.09 },
  { symbol: 'DRREDDY.NS', name: "Dr. Reddy's Laboratories", sector: 'Healthcare & Pharma', price: 1280, weight: 0.08 },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India', sector: 'Food Processing', price: 2350, weight: 0.09 },
];

export function buildDemoDatabase(now = new Date()) {
  const rand = mulberry32(20261117);

  // ---- Daily NAV history: about 14 months of weekdays, starting at 10.00 ----
  const fund = [];
  const start = new Date(now);
  start.setDate(start.getDate() - 425);
  let nav = 10;
  let id = 1;
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (wd === 0 || wd === 6) continue;
    nav = nav * (1 + (rand() - 0.47) * 0.016);
    fund.push({ id: uid('nav', id++), date: dayStr(d), nav: Number(nav.toFixed(4)), total_value: 0, total_units: 0, created_at: d.toISOString() });
  }
  const navOn = (date) => {
    const s = dayStr(date);
    let last = fund[0];
    for (const r of fund) { if (r.date <= s) last = r; else break; }
    return last.nav;
  };

  // ---- People ----
  const clients = [
    { id: uid('user', 0), name: 'Demo Fund Manager', email: 'admin@fundtrack.demo', phone: '9000000100', role: 'admin', created_at: start.toISOString() },
    ...CLIENTS.map((c, i) => ({ id: uid('user', i + 1), ...c, role: 'client', created_at: new Date(start.getTime() + i * 20 * 86400000).toISOString() })),
  ];
  const passwords = Object.fromEntries(clients.map((c) => [c.email, DEMO_PASSWORD]));

  // ---- Investments and withdrawals at the NAV of their date ----
  const transactions = [];
  let tid = 1;
  const addTx = (client, type, amount, date) => {
    const n = navOn(date);
    transactions.push({
      id: uid('tx', tid++), client_id: client.id, type, amount,
      nav_at_transaction: n, units: Number((amount / n).toFixed(4)),
      created_at: date.toISOString(),
    });
  };
  clients.filter((c) => c.role === 'client').forEach((c, i) => {
    let d = new Date(start.getTime() + (i * 20 + 3) * 86400000);
    addTx(c, 'INVEST', [100000, 50000, 75000, 150000, 60000, 40000][i], d);
    while (true) {
      d = new Date(d.getTime() + (45 + Math.floor(rand() * 60)) * 86400000);
      if (d > now) break;
      if (rand() < 0.82) addTx(c, 'INVEST', Math.round((10 + rand() * 40)) * 1000, d);
      else addTx(c, 'WITHDRAW', Math.round((5 + rand() * 15)) * 1000, d);
    }
  });
  transactions.sort((a, b) => a.created_at.localeCompare(b.created_at));

  // Units in issue on each date, so every NAV row has a matching AUM
  let units = 0;
  let ti = 0;
  for (const row of fund) {
    while (ti < transactions.length && transactions[ti].created_at.slice(0, 10) <= row.date) {
      const t = transactions[ti++];
      units += t.type === 'INVEST' ? t.units : -t.units;
    }
    row.total_units = Number(units.toFixed(4));
    row.total_value = Number((units * row.nav).toFixed(2));
  }

  // ---- Holdings sized so that today's value / units = latest NAV ----
  const latest = fund[fund.length - 1];
  const aum = latest.total_value;
  const syncedAt = now.toISOString();
  const holdings = PORTFOLIO.map((p, i) => {
    const qty = Math.max(1, Math.round((aum * p.weight) / p.price));
    return {
      id: uid('hold', i + 1), symbol: p.symbol, name: p.name, category: 'Equity', sector: p.sector,
      quantity: qty, avg_cost: Number((p.price * (0.82 + rand() * 0.2)).toFixed(2)), current_price: p.price,
      last_synced_at: syncedAt, created_at: start.toISOString(),
    };
  });
  const invested = holdings.reduce((s, h) => s + h.quantity * h.current_price, 0);
  holdings.push({
    id: uid('hold', 99), symbol: 'CASH', name: 'Cash Balance', category: 'Cash', sector: 'Others / Cash',
    quantity: Number((aum - invested).toFixed(2)), avg_cost: 1, current_price: 1, last_synced_at: syncedAt, created_at: start.toISOString(),
  });

  // ---- Requests, notices and reports ----
  const ago = (days) => new Date(now.getTime() - days * 86400000).toISOString();
  const requests = [
    { id: uid('req', 1), client_id: clients[2].id, type: 'INVEST', amount: 50000, withdraw_all: false, note: 'Adding my bonus this month.', status: 'PENDING', admin_note: null, created_at: ago(1), updated_at: ago(1) },
    { id: uid('req', 2), client_id: clients[4].id, type: 'WITHDRAW', amount: 20000, withdraw_all: false, note: null, status: 'CONTACTED', admin_note: 'Called, will process on Monday.', created_at: ago(3), updated_at: ago(2) },
    { id: uid('req', 3), client_id: clients[1].id, type: 'INVEST', amount: 25000, withdraw_all: false, note: null, status: 'COMPLETED', admin_note: null, created_at: ago(20), updated_at: ago(18) },
  ];

  const notices = [
    { id: uid('notice', 1), title: 'Welcome to the FundTrack demo', body: 'This is a demo with sample data. Explore the dashboard, portfolio and fund performance pages, or sign in as the fund manager to see the admin tools.', pinned: true, created_at: ago(2), updated_at: ago(2) },
    { id: uid('notice', 2), title: 'Quarterly update', body: 'The portfolio was rebalanced towards consumer and healthcare names this quarter. Cash is held for upcoming opportunities.', pinned: false, created_at: ago(12), updated_at: ago(12) },
    { id: uid('notice', 3), title: 'Market holiday', body: 'Markets are closed on the coming public holiday, so NAV will not update that day.', pinned: false, created_at: ago(30), updated_at: ago(30) },
  ];

  const reports = [0, 1, 2].map((k) => {
    const m = new Date(now.getFullYear(), now.getMonth() - 1 - k, 1);
    const label = m.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    return {
      id: uid('report', k + 1), month: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`,
      title: `Monthly factsheet - ${label}`, file_url: '/sample-report.pdf', created_at: ago(5 + k * 30),
    };
  });

  return { clients, passwords, transactions, holdings, fund, requests, notices, reports };
}
