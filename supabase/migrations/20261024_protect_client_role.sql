-- Stop clients from promoting themselves to admin.
-- The Settings page lets a client update their own `clients` row (name, phone)
-- straight from the browser. Whatever the table's RLS policies allow, this
-- trigger makes sure only an admin can set `role`, `id` or `email`.
-- Server-side calls with the service role key (auth.uid() is null) and the
-- Supabase SQL editor are not affected.
-- Run this once in the Supabase SQL editor.

create or replace function public.clients_protect_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_admin boolean;
begin
  if auth.uid() is null then
    return new;
  end if;

  select exists (
    select 1 from public.clients where id = auth.uid() and role = 'admin'
  ) into caller_is_admin;

  if caller_is_admin then
    return new;
  end if;

  if tg_op = 'INSERT' and new.role is distinct from 'client' then
    raise exception 'Only an admin can create admin accounts';
  end if;

  if tg_op = 'UPDATE' and (
    new.role is distinct from old.role
    or new.id is distinct from old.id
    or new.email is distinct from old.email
  ) then
    raise exception 'Only an admin can change role, id or email';
  end if;

  return new;
end;
$$;

drop trigger if exists clients_protect_role on public.clients;
create trigger clients_protect_role
  before insert or update on public.clients
  for each row execute function public.clients_protect_role();
