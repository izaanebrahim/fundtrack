-- Client investment / withdrawal requests.
-- Clients raise a request from their dashboard; the admin contacts them,
-- records the actual transaction manually, then closes the request.
-- Run this once in the Supabase SQL editor.

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null check (type in ('INVEST', 'WITHDRAW')),
  amount numeric(14, 2) check (amount is null or amount > 0),
  withdraw_all boolean not null default false,
  note text check (note is null or char_length(note) <= 500),
  status text not null default 'PENDING'
    check (status in ('PENDING', 'CONTACTED', 'COMPLETED', 'CANCELLED')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- "Withdraw everything" only makes sense for withdrawals,
  -- and every request needs either an amount or the withdraw-all flag.
  constraint requests_withdraw_all_type check (not withdraw_all or type = 'WITHDRAW'),
  constraint requests_amount_or_all check (amount is not null or withdraw_all)
);

create index if not exists requests_status_created_idx
  on public.requests (status, created_at desc);
create index if not exists requests_client_idx
  on public.requests (client_id, created_at desc);

-- Keep updated_at current
create or replace function public.requests_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists requests_touch_updated_at on public.requests;
create trigger requests_touch_updated_at
  before update on public.requests
  for each row execute function public.requests_touch_updated_at();

-- Row Level Security
alter table public.requests enable row level security;

-- Clients see only their own requests
drop policy if exists "requests_client_select_own" on public.requests;
create policy "requests_client_select_own" on public.requests
  for select using (client_id = auth.uid());

-- Clients can only create new PENDING requests for themselves
drop policy if exists "requests_client_insert_own" on public.requests;
create policy "requests_client_insert_own" on public.requests
  for insert with check (
    client_id = auth.uid()
    and status = 'PENDING'
    and admin_note is null
  );

-- Admins can see and update every request
drop policy if exists "requests_admin_select" on public.requests;
create policy "requests_admin_select" on public.requests
  for select using (
    exists (select 1 from public.clients c where c.id = auth.uid() and c.role = 'admin')
  );

drop policy if exists "requests_admin_update" on public.requests;
create policy "requests_admin_update" on public.requests
  for update using (
    exists (select 1 from public.clients c where c.id = auth.uid() and c.role = 'admin')
  ) with check (
    exists (select 1 from public.clients c where c.id = auth.uid() and c.role = 'admin')
  );
