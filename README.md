# Barakha Capital

A full-stack investment fund management platform I built for **Barakha Capital** — a private fund I manage. Clients log in to track their portfolio, and I use the admin panel to manage everything from holdings to NAV calculations.

---

## What It Does

### For Clients
- **Dashboard** — See portfolio value, profit/loss, daily NAV change, and asset allocation at a glance
- **Portfolio** — Detailed breakdown of current holdings and market value
- **Transactions** — Full history of investments and withdrawals
- **Fund Performance** — Interactive NAV chart (1M / 6M / 1Y / All) benchmarked against Nifty 50
- **NAV History** — Historical Net Asset Value table
- **Reports** — Downloadable portfolio summaries

### For Admin (Me)
- **Admin Dashboard** — Fund-level AUM, total units, and daily NAV stats
- **Manage Transactions** — Record investments and withdrawals for any client
- **Client Management** — Onboard new clients
- **Holdings Management** — Add, edit, or remove fund holdings across 25+ Indian market sectors
- **NAV Sync** — Manually trigger a Yahoo Finance price sync or let the daily cron handle it

### Automation
- A **Vercel Cron Job** runs daily at 4:00 PM IST to automatically:
  - Fetch live stock prices from Yahoo Finance
  - Update all holdings in a single batched database call
  - Recalculate AUM, total units, and NAV
  - Save the day's NAV snapshot to history

---

## Built With

| Layer        | Technology                                     |
| ------------ | ---------------------------------------------- |
| Framework    | Next.js 16 (App Router)                        |
| Frontend     | React 19, Tailwind CSS 4                       |
| Charts       | Recharts                                       |
| Icons        | Lucide React                                   |
| Auth & DB    | Supabase (Auth + PostgreSQL)                   |
| Market Data  | Yahoo Finance 2                                |
| Hosting      | Vercel (with Cron Jobs)                        |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── admin/           # Admin API routes (create client, sync NAV)
│   │   ├── cron/sync/       # Automated daily price sync
│   │   └── market/          # Market data endpoints
│   ├── admin/               # Admin pages
│   ├── dashboard/           # Client dashboard
│   ├── fund-performance/    # NAV chart with Nifty 50 benchmark
│   ├── holdings/            # Client holdings view
│   ├── login/               # Auth page
│   ├── nav-history/         # Historical NAV table
│   ├── portfolio/           # Portfolio breakdown
│   ├── reports/             # Reports
│   ├── settings/            # Account settings
│   └── transactions/        # Transaction history
├── components/
│   ├── AllocationChart.js   # Donut chart (asset/sector mix)
│   ├── AppLayout.js         # Auth shell with sidebar
│   └── Sidebar.js           # Navigation (client & admin views)
├── context/
│   └── AuthContext.js       # Supabase auth state
└── lib/
    └── supabase.js          # Supabase client init
```

---

## Database

Four Supabase (PostgreSQL) tables power the app:

| Table          | Purpose                                                          |
| -------------- | ---------------------------------------------------------------- |
| `clients`      | User profiles with roles (`admin` / `client`), linked to Auth    |
| `holdings`     | Fund holdings — symbol, sector, quantity, avg cost, live price    |
| `transactions` | Investment & withdrawal records per client                       |
| `fund`         | Daily NAV snapshots — date, AUM, total units, NAV                |
