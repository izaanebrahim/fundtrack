// Demo stand-ins for the admin server routes.
//
// In the production version these are server routes that verify the admin's
// token and use privileged database access. In this demo they run in the
// browser against the sample data, and return a fetch-like response
// ({ ok, json() }) so the pages call them the same way.

import { getDemoDb, saveDemoDb } from './supabase';

const respond = (ok, body) => ({ ok, status: ok ? 200 : 400, json: async () => body });
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Create a client login (production: creates an auth user + profile row)
export async function createClient({ name, email, password, phone }) {
  await pause(300);
  if (!email || !password || !name) return respond(false, { error: 'Missing required fields' });
  const db = getDemoDb();
  const address = email.trim().toLowerCase();
  if (db.clients.some((c) => c.email.toLowerCase() === address)) {
    return respond(false, { error: 'A user with this email address has already been registered' });
  }
  db.clients.push({ id: newId('user'), name, email: address, phone: phone || null, role: 'client', created_at: new Date().toISOString() });
  db.passwords[address] = password;
  saveDemoDb();
  return respond(true, { success: true, message: 'Client created successfully.' });
}

// Refresh prices and record today's NAV.
// Production fetches live quotes from Yahoo Finance on the server; the demo
// nudges each price by a small random amount so the flow can be tried.
export async function syncNav() {
  await pause(700);
  const db = getDemoDb();
  if (!db.holdings.length) return respond(false, { error: 'No holdings found to sync.' });

  const now = new Date().toISOString();
  let totalValue = 0;
  for (const h of db.holdings) {
    if (h.symbol.toUpperCase() !== 'CASH') {
      h.current_price = Number((h.current_price * (1 + (Math.random() - 0.48) * 0.02)).toFixed(2));
      h.last_synced_at = now;
    }
    totalValue += h.quantity * h.current_price;
  }

  const totalUnits = db.transactions.reduce((s, t) => s + (t.type === 'INVEST' ? Number(t.units) : -Number(t.units)), 0);
  const nav = totalUnits > 0 ? totalValue / totalUnits : 10;
  const today = now.split('T')[0];
  const existing = db.fund.find((r) => r.date === today);
  if (existing) Object.assign(existing, { total_value: totalValue, total_units: totalUnits, nav });
  else db.fund.push({ id: newId('nav'), date: today, total_value: totalValue, total_units: totalUnits, nav, created_at: now });

  saveDemoDb();
  return respond(true, { success: true, nav, totalValue, totalUnits });
}

// Delete one NAV history row
export async function deleteNav({ id }) {
  await pause(200);
  const db = getDemoDb();
  db.fund = db.fund.filter((r) => r.id !== id);
  saveDemoDb();
  return respond(true, { success: true });
}
