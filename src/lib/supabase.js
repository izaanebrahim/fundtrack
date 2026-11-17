// Demo data layer.
//
// The production version of FundTrack talks to a hosted Postgres database.
// This public version has no backend at all: this file provides the same
// client interface (from().select().eq()..., auth, rpc) over sample data that
// lives in the browser's localStorage. Changes you make in the demo stay in
// your browser only, and "Reset demo data" restores the original sample.

import { buildDemoDatabase } from './demoData';

const DB_KEY = 'fundtrack-demo-db-v1';
const SESSION_KEY = 'fundtrack-demo-session';
const isBrowser = typeof window !== 'undefined';

// ---------- storage ----------
let memoryDb = null;

function loadDb() {
  if (memoryDb) return memoryDb;
  if (isBrowser) {
    try {
      const raw = window.localStorage.getItem(DB_KEY);
      if (raw) {
        memoryDb = JSON.parse(raw);
        return memoryDb;
      }
    } catch { /* storage unavailable or corrupt: fall back to a fresh copy */ }
  }
  memoryDb = buildDemoDatabase();
  saveDb();
  return memoryDb;
}

function saveDb() {
  if (!isBrowser || !memoryDb) return;
  try { window.localStorage.setItem(DB_KEY, JSON.stringify(memoryDb)); } catch { /* ignore quota errors */ }
}

export function resetDemoData() {
  memoryDb = buildDemoDatabase();
  saveDb();
}

export function getDemoDb() {
  return loadDb();
}

export function saveDemoDb() {
  saveDb();
}

const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const clone = (v) => JSON.parse(JSON.stringify(v));

// ---------- select parsing: "*, client:clients(name, email)" ----------
function splitTopLevel(str) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function parseColumns(cols) {
  const fields = [];
  const relations = [];
  for (const part of splitTopLevel((cols || '*').replace(/\s+/g, ' '))) {
    const m = part.match(/^(?:(\w+)\s*:\s*)?(\w+)\s*\((.*)\)$/);
    if (m) relations.push({ alias: m[1] || m[2], table: m[2], columns: m[3] });
    else fields.push(part);
  }
  return { fields, relations };
}

// How tables relate, for the embedded selects the app uses
const FOREIGN_KEYS = { transactions: 'client_id', requests: 'client_id' };

function project(row, columns, table, db) {
  const { fields, relations } = parseColumns(columns);
  let out = {};
  if (fields.includes('*') || fields.length === 0) out = { ...row };
  else for (const f of fields) out[f] = row[f];

  for (const rel of relations) {
    const fk = FOREIGN_KEYS[table];
    if (fk && rel.table === 'clients') {
      // many-to-one: transactions.client_id -> clients.id
      const parent = db.clients.find((c) => c.id === row[fk]);
      out[rel.alias] = parent ? project(parent, rel.columns, 'clients', db) : null;
    } else if (table === 'clients' && FOREIGN_KEYS[rel.table]) {
      // one-to-many: clients.id <- transactions.client_id
      const key = FOREIGN_KEYS[rel.table];
      out[rel.alias] = (db[rel.table] || []).filter((c) => c[key] === row.id).map((c) => project(c, rel.columns, rel.table, db));
    }
  }
  return out;
}

// ---------- database rules the real database enforces ----------
function checkInsert(table, row, db) {
  if (table === 'transactions' && row.type === 'WITHDRAW') {
    const held = db.transactions
      .filter((t) => t.client_id === row.client_id && t.id !== row.id)
      .reduce((s, t) => s + (t.type === 'INVEST' ? Number(t.units) : -Number(t.units)), 0);
    if (Number(row.units) > held + 0.0001) {
      return `Withdrawal of ${Number(row.units).toFixed(4)} units is more than the ${held.toFixed(4)} units this client holds`;
    }
  }
  if (table === 'clients' && db.clients.some((c) => c.email === row.email && c.id !== row.id)) {
    return 'A user with this email address has already been registered';
  }
  return null;
}

const ID_PREFIX = { clients: 'user', transactions: 'tx', holdings: 'hold', fund: 'nav', requests: 'req', notices: 'notice', reports: 'report' };

// ---------- query builder ----------
class Query {
  constructor(table) {
    this.table = table;
    this.op = 'select';
    this.columns = '*';
    this.filters = [];
    this.orders = [];
    this.limitN = null;
    this.mode = 'many';
    this.countOpt = null;
    this.head = false;
    this.payload = null;
    this.returning = false;
  }

  select(columns = '*', opts = {}) {
    if (this.op === 'select') {
      this.columns = columns;
      this.countOpt = opts.count || null;
      this.head = !!opts.head;
    } else {
      this.returning = true;
      this.columns = columns;
    }
    return this;
  }
  insert(rows) { this.op = 'insert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
  update(values) { this.op = 'update'; this.payload = values; return this; }
  upsert(rows) { this.op = 'upsert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
  delete() { this.op = 'delete'; return this; }

  eq(col, val) { this.filters.push((r) => r[col] === val); return this; }
  neq(col, val) { this.filters.push((r) => r[col] !== val); return this; }
  gt(col, val) { this.filters.push((r) => r[col] > val); return this; }
  gte(col, val) { this.filters.push((r) => r[col] >= val); return this; }
  lt(col, val) { this.filters.push((r) => r[col] < val); return this; }
  lte(col, val) { this.filters.push((r) => r[col] <= val); return this; }
  in(col, vals) { this.filters.push((r) => vals.includes(r[col])); return this; }
  order(col, opts = {}) { this.orders.push({ col, asc: opts.ascending !== false }); return this; }
  limit(n) { this.limitN = n; return this; }
  single() { this.mode = 'single'; return this; }
  maybeSingle() { this.mode = 'maybeSingle'; return this; }

  then(resolve, reject) {
    return new Promise((res) => {
      // Small delay so loading states behave like a real network call
      setTimeout(() => res(this.run()), 60);
    }).then(resolve, reject);
  }

  run() {
    const db = loadDb();
    if (!db[this.table]) db[this.table] = [];
    const rows = db[this.table];
    const match = (r) => this.filters.every((f) => f(r));
    let affected = [];

    try {
      if (this.op === 'insert' || this.op === 'upsert') {
        for (const input of this.payload) {
          const existingIdx = this.op === 'upsert' && input.id ? rows.findIndex((r) => r.id === input.id) : -1;
          const now = new Date().toISOString();
          const row = existingIdx >= 0
            ? { ...rows[existingIdx], ...clone(input), updated_at: now }
            : { id: newId(ID_PREFIX[this.table] || 'row'), created_at: now, ...clone(input) };
          if (this.table === 'requests' && !row.status) row.status = 'PENDING';
          if (this.table === 'notices') { row.updated_at = now; if (row.pinned === undefined) row.pinned = false; }
          const problem = checkInsert(this.table, row, db);
          if (problem) return { data: null, error: { message: problem }, count: null };
          if (existingIdx >= 0) rows[existingIdx] = row; else rows.push(row);
          affected.push(row);
        }
        saveDb();
      } else if (this.op === 'update') {
        const now = new Date().toISOString();
        for (let i = 0; i < rows.length; i++) {
          if (!match(rows[i])) continue;
          const row = { ...rows[i], ...clone(this.payload) };
          if ('updated_at' in rows[i] || this.table === 'requests' || this.table === 'notices') row.updated_at = now;
          const problem = checkInsert(this.table, row, db);
          if (problem) return { data: null, error: { message: problem }, count: null };
          rows[i] = row;
          affected.push(row);
        }
        saveDb();
      } else if (this.op === 'delete') {
        affected = rows.filter(match);
        db[this.table] = rows.filter((r) => !match(r));
        saveDb();
      } else {
        affected = rows.filter(match);
      }
    } catch (err) {
      return { data: null, error: { message: err.message }, count: null };
    }

    if (this.op !== 'select' && !this.returning) return { data: null, error: null, count: null };

    let result = [...affected];
    for (const o of [...this.orders].reverse()) {
      result.sort((a, b) => {
        const x = a[o.col]; const y = b[o.col];
        if (x === y) return 0;
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
        return o.asc ? cmp : -cmp;
      });
    }
    const count = result.length;
    if (this.limitN !== null) result = result.slice(0, this.limitN);
    if (this.head) return { data: null, error: null, count };

    const data = result.map((r) => project(r, this.columns, this.table, db));
    if (this.mode === 'single') {
      if (data.length !== 1) return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' }, count: null };
      return { data: data[0], error: null, count: this.countOpt ? count : null };
    }
    if (this.mode === 'maybeSingle') return { data: data[0] || null, error: null, count: null };
    return { data, error: null, count: this.countOpt ? count : null };
  }
}

// ---------- auth ----------
const listeners = new Set();

function readSession() {
  if (!isBrowser) return null;
  try { return JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}

function writeSession(session) {
  if (!isBrowser) return;
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}

function emit(event, session) {
  listeners.forEach((cb) => {
    try { cb(event, session); } catch { /* listener errors are the listener's problem */ }
  });
}

function makeSession(client) {
  return {
    access_token: `demo-token-${client.id}`,
    token_type: 'bearer',
    user: { id: client.id, email: client.email, role: 'authenticated' },
  };
}

const auth = {
  async getSession() {
    return { data: { session: readSession() }, error: null };
  },
  async getUser() {
    const s = readSession();
    return { data: { user: s?.user || null }, error: null };
  },
  onAuthStateChange(callback) {
    listeners.add(callback);
    setTimeout(() => callback('INITIAL_SESSION', readSession()), 0);
    return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
  },
  async signInWithPassword({ email, password }) {
    const db = loadDb();
    const address = String(email || '').trim().toLowerCase();
    const client = db.clients.find((c) => c.email.toLowerCase() === address);
    await new Promise((r) => setTimeout(r, 250));
    if (!client || db.passwords[client.email] !== password) {
      return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
    }
    const session = makeSession(client);
    writeSession(session);
    emit('SIGNED_IN', session);
    return { data: { user: session.user, session }, error: null };
  },
  async signOut() {
    writeSession(null);
    emit('SIGNED_OUT', null);
    return { error: null };
  },
  async resetPasswordForEmail() {
    // No emails are sent in the demo
    return { data: null, error: { message: 'Password reset emails are turned off in this demo. Use a demo account below.' } };
  },
  async updateUser({ password } = {}) {
    const s = readSession();
    if (!s) return { data: { user: null }, error: { message: 'Not signed in' } };
    if (password) {
      const db = loadDb();
      db.passwords[s.user.email] = password;
      saveDb();
    }
    return { data: { user: s.user }, error: null };
  },
};

// ---------- database functions ----------
async function rpc(name) {
  const db = loadDb();
  if (name === 'fund_total_units') {
    const units = db.transactions.reduce((s, t) => s + (t.type === 'INVEST' ? Number(t.units) : t.type === 'WITHDRAW' ? -Number(t.units) : 0), 0);
    return { data: units, error: null };
  }
  return { data: null, error: { message: `Unknown function ${name}` } };
}

export const supabase = {
  from: (table) => new Query(table),
  rpc,
  auth,
};
