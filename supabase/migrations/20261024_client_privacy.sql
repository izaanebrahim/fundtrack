-- Client privacy and withdrawal safety.
--
-- 1. Clients can only read their own transactions and their own profile row.
--    Fund-wide unit totals (needed to work out the live NAV) come from
--    fund_total_units(), which returns one number and no client details.
-- 2. A withdrawal can never take a client below zero units.
--
-- Server routes that use the service role key bypass RLS and are not affected.
-- Run this once in the Supabase SQL editor, after the app update is deployed.

-- Admin check that does not read `clients` through RLS (avoids policy recursion)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.clients where id = auth.uid() and role = 'admin');
$$;

-- Fund-wide units in issue, safe to expose to every signed-in user
create or replace function public.fund_total_units()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(case when type = 'INVEST' then units when type = 'WITHDRAW' then -units else 0 end), 0)
  from public.transactions;
$$;

revoke all on function public.fund_total_units() from public;
grant execute on function public.fund_total_units() to authenticated;

-- Replace whatever policies exist today with an explicit set
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('transactions', 'clients')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end;
$$;

alter table public.transactions enable row level security;

create policy "transactions_select_own_or_admin" on public.transactions
  for select using (client_id = auth.uid() or public.is_admin());

create policy "transactions_admin_insert" on public.transactions
  for insert with check (public.is_admin());

create policy "transactions_admin_update" on public.transactions
  for update using (public.is_admin()) with check (public.is_admin());

create policy "transactions_admin_delete" on public.transactions
  for delete using (public.is_admin());

alter table public.clients enable row level security;

create policy "clients_select_own_or_admin" on public.clients
  for select using (id = auth.uid() or public.is_admin());

-- Clients edit their own name/phone; clients_protect_role stops role/email changes
create policy "clients_update_own_or_admin" on public.clients
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "clients_admin_insert" on public.clients
  for insert with check (public.is_admin());

create policy "clients_admin_delete" on public.clients
  for delete using (public.is_admin());

-- Block withdrawals larger than the client's current holding
create or replace function public.transactions_check_withdrawal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  held numeric;
begin
  if new.type <> 'WITHDRAW' then
    return new;
  end if;

  select coalesce(sum(case when type = 'INVEST' then units else -units end), 0)
    into held
  from public.transactions
  where client_id = new.client_id
    and id is distinct from new.id;

  if new.units > held + 0.0001 then
    raise exception 'Withdrawal of % units is more than the % units this client holds', round(new.units, 4), round(held, 4);
  end if;

  return new;
end;
$$;

drop trigger if exists transactions_check_withdrawal on public.transactions;
create trigger transactions_check_withdrawal
  before insert or update on public.transactions
  for each row execute function public.transactions_check_withdrawal();
