-- Manager's notices: short updates from the fund manager to every client
-- (how the fund is doing, upcoming changes, holidays, and so on).
-- Run this once in the Supabase SQL editor.

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 5000),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notices_created_idx
  on public.notices (pinned desc, created_at desc);

-- Keep updated_at current
create or replace function public.notices_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notices_touch_updated_at on public.notices;
create trigger notices_touch_updated_at
  before update on public.notices
  for each row execute function public.notices_touch_updated_at();

-- Row Level Security
alter table public.notices enable row level security;

-- Every signed-in user can read notices
drop policy if exists "notices_select_signed_in" on public.notices;
create policy "notices_select_signed_in" on public.notices
  for select using (auth.uid() is not null);

-- Only admins can post, edit or delete
drop policy if exists "notices_admin_insert" on public.notices;
create policy "notices_admin_insert" on public.notices
  for insert with check (
    exists (select 1 from public.clients c where c.id = auth.uid() and c.role = 'admin')
  );

drop policy if exists "notices_admin_update" on public.notices;
create policy "notices_admin_update" on public.notices
  for update using (
    exists (select 1 from public.clients c where c.id = auth.uid() and c.role = 'admin')
  ) with check (
    exists (select 1 from public.clients c where c.id = auth.uid() and c.role = 'admin')
  );

drop policy if exists "notices_admin_delete" on public.notices;
create policy "notices_admin_delete" on public.notices
  for delete using (
    exists (select 1 from public.clients c where c.id = auth.uid() and c.role = 'admin')
  );
