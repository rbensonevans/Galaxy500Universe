-- Phase 2 of the financial model: startup funding and equity pledging.
-- See FINANCIAL_MODEL.md. Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

-- ============================ STARTUP FUNDING & EQUITY (Phase 2) ===========
-- The "shares reserve" (iglobeshares) is a pure system construct — no auth
-- user. Global pledged-share total lives in the reserves table.
create table if not exists public.reserves (
  name           text primary key,
  pledged_shares numeric(30, 4) not null default 0
);
insert into public.reserves (name, pledged_shares) values ('shares', 0)
  on conflict (name) do nothing;
alter table public.reserves enable row level security;
drop policy if exists "reserves_select" on public.reserves;
create policy "reserves_select" on public.reserves for select using (auth.uid() is not null);

-- Each startup has a fixed cap table; funding draws GLXY from the currency
-- reserve and pledges shares to the universe at funding_price (GLXY/share).
alter table public.startups add column if not exists total_shares        numeric(30,4) not null default 1000000;
alter table public.startups add column if not exists pledged_shares      numeric(30,4) not null default 0;
alter table public.startups add column if not exists outstanding_funding numeric(20,2) not null default 0;
alter table public.startups add column if not exists funding_price       numeric(20,4) not null default 1;
alter table public.startups add column if not exists last_funding_at     timestamptz;

create table if not exists public.startup_funding (
  id            uuid primary key default gen_random_uuid(),
  startup_id    uuid not null references public.startups (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  amount        numeric(20,2) not null,    -- + drawdown, - repayment
  kind          text not null,             -- initial | annual | repayment
  shares_pledged numeric(30,4) not null default 0, -- +pledged, -released
  created_at    timestamptz not null default now()
);
alter table public.startup_funding enable row level security;
drop policy if exists "startup_funding_select_own" on public.startup_funding;
create policy "startup_funding_select_own" on public.startup_funding for select using (
  exists (select 1 from public.startups s where s.id = startup_id and s.user_id = auth.uid())
);
create index if not exists startup_funding_idx on public.startup_funding (startup_id, created_at desc);

-- Request funding for a startup the caller owns. First draw is 'initial';
-- subsequent draws are 'annual' and require >= 365 days since the last draw.
create or replace function public.request_funding(p_startup uuid, p_amount numeric)
returns public.startups language plpgsql security definer set search_path = public as $fn$
declare
  uid uuid := auth.uid(); s public.startups; amt numeric(20,2) := round(p_amount,2);
  reserve uuid; shares numeric(30,4); kind text;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into s from public.startups where id = p_startup for update;
  if not found then raise exception 'Startup not found'; end if;
  if s.user_id <> uid then raise exception 'Only the founder can request funding'; end if;
  if amt is null or amt <= 0 then raise exception 'Enter an amount greater than 0'; end if;

  if s.last_funding_at is null then
    kind := 'initial';
  else
    if now() - s.last_funding_at < interval '365 days' then
      raise exception 'Annual funding is available once per year. Next request after %',
        to_char(s.last_funding_at + interval '365 days', 'Mon DD, YYYY');
    end if;
    kind := 'annual';
  end if;

  shares := round(amt / nullif(s.funding_price,0), 4);
  if s.pledged_shares + shares > s.total_shares then
    raise exception 'Funding exceeds available equity (% shares remain)',
      to_char(s.total_shares - s.pledged_shares, 'FM999999999990.00');
  end if;

  select user_id into reserve from public.system_accounts where role = 'currency_reserve' limit 1;

  insert into public.wallets (user_id, balance) values (uid, 0) on conflict (user_id) do nothing;
  update public.wallets set balance = balance + amt where user_id = uid;
  if reserve is not null then
    update public.wallets set balance = balance - amt where user_id = reserve;
  end if;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (uid, amt, 'startup_funding', 'Funding for ' || s.name);

  update public.startups
    set pledged_shares = pledged_shares + shares,
        outstanding_funding = outstanding_funding + amt,
        last_funding_at = now()
    where id = p_startup returning * into s;
  update public.reserves set pledged_shares = pledged_shares + shares where name = 'shares';
  insert into public.startup_funding (startup_id, user_id, amount, kind, shares_pledged)
    values (p_startup, uid, amt, kind, shares);
  return s;
end; $fn$;

-- Repay funding: returns GLXY to the reserve and releases pledged shares.
create or replace function public.repay_funding(p_startup uuid, p_amount numeric)
returns public.startups language plpgsql security definer set search_path = public as $fn$
declare
  uid uuid := auth.uid(); s public.startups; amt numeric(20,2) := round(p_amount,2);
  reserve uuid; shares numeric(30,4); bal numeric(20,2);
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into s from public.startups where id = p_startup for update;
  if not found then raise exception 'Startup not found'; end if;
  if s.user_id <> uid then raise exception 'Only the founder can repay funding'; end if;
  if amt is null or amt <= 0 then raise exception 'Enter an amount greater than 0'; end if;
  if amt > s.outstanding_funding then raise exception 'Amount exceeds outstanding funding'; end if;

  select balance into bal from public.wallets where user_id = uid for update;
  if coalesce(bal,0) < amt then raise exception 'Not enough GLXY to repay'; end if;

  shares := round(amt / nullif(s.funding_price,0), 4);
  select user_id into reserve from public.system_accounts where role = 'currency_reserve' limit 1;

  update public.wallets set balance = balance - amt where user_id = uid;
  if reserve is not null then
    update public.wallets set balance = balance + amt where user_id = reserve;
  end if;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (uid, -amt, 'startup_repayment', 'Repayment for ' || s.name);

  update public.startups
    set pledged_shares = greatest(pledged_shares - shares, 0),
        outstanding_funding = outstanding_funding - amt
    where id = p_startup returning * into s;
  update public.reserves set pledged_shares = greatest(pledged_shares - shares, 0) where name = 'shares';
  insert into public.startup_funding (startup_id, user_id, amount, kind, shares_pledged)
    values (p_startup, uid, -amt, 'repayment', -shares);
  return s;
end; $fn$;

create or replace function public.total_pledged_shares() returns numeric language sql security definer set search_path = public stable as $tp$
  select coalesce((select pledged_shares from public.reserves where name = 'shares'), 0);
$tp$;

revoke all on function public.request_funding(uuid, numeric) from public;
revoke all on function public.repay_funding(uuid, numeric) from public;
revoke all on function public.total_pledged_shares() from public;
grant execute on function public.request_funding(uuid, numeric) to authenticated;
grant execute on function public.repay_funding(uuid, numeric) to authenticated;
grant execute on function public.total_pledged_shares() to authenticated;

