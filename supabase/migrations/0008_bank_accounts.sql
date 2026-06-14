-- Generalize the Crypto Bank into multiple accounts: Checking (0% APY, daily
-- transactions), Savings (5%), and Money Market (10%, stock-related investing).
-- Migrates any existing wallets.savings_balance into a savings account.
-- Run in Supabase SQL Editor. Idempotent.
--
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

create table if not exists public.bank_accounts (
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('checking','savings','money_market')),
  balance    numeric(20, 2) not null default 0,
  rate       numeric(6, 4) not null default 0,
  accrued_at timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table public.bank_accounts enable row level security;
drop policy if exists "bank_accounts_select_own" on public.bank_accounts;
create policy "bank_accounts_select_own" on public.bank_accounts for select using (auth.uid() = user_id);

alter table public.bank_transactions add column if not exists account text not null default 'savings';

create or replace function public._bank_default_rate(kind text) returns numeric language sql immutable as $rate$
  select case kind when 'savings' then 0.0500 when 'money_market' then 0.1000 else 0.0000 end::numeric;
$rate$;
revoke all on function public._bank_default_rate(text) from public;

insert into public.bank_accounts (user_id, kind, balance, rate, accrued_at)
  select user_id, 'savings', savings_balance, 0.0500, coalesce(savings_accrued_at, now()) from public.wallets
  on conflict (user_id, kind) do nothing;
insert into public.bank_accounts (user_id, kind, balance, rate)
  select user_id, 'checking', 0, 0.0000 from public.wallets on conflict (user_id, kind) do nothing;
insert into public.bank_accounts (user_id, kind, balance, rate)
  select user_id, 'money_market', 0, 0.1000 from public.wallets on conflict (user_id, kind) do nothing;

create or replace function public.bank_account_accrue(account text)
returns public.bank_accounts language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); a public.bank_accounts; pending numeric(20,2);
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if account not in ('checking','savings','money_market') then raise exception 'Unknown account'; end if;
  insert into public.bank_accounts (user_id, kind, rate) values (uid, account, public._bank_default_rate(account))
    on conflict (user_id, kind) do nothing;
  select * into a from public.bank_accounts where user_id = uid and kind = account for update;
  pending := round(a.balance * a.rate * (extract(epoch from (now() - a.accrued_at)) / 31536000.0), 2);
  if pending > 0 then
    update public.bank_accounts set balance = balance + pending, accrued_at = now()
      where user_id = uid and kind = account returning * into a;
    insert into public.bank_transactions (user_id, account, amount, kind) values (uid, account, pending, 'interest');
  end if;
  return a;
end; $fn$;

create or replace function public.bank_account_deposit(account text, amount numeric)
returns public.bank_accounts language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); a public.bank_accounts; amt numeric(20,2) := round(amount,2); bal numeric(20,2);
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if account not in ('checking','savings','money_market') then raise exception 'Unknown account'; end if;
  if amt is null or amt <= 0 then raise exception 'Enter an amount greater than 0'; end if;
  perform public.bank_account_accrue(account);
  select balance into bal from public.wallets where user_id = uid for update;
  if bal is null then raise exception 'No wallet yet'; end if;
  if bal < amt then raise exception 'Not enough spendable GLXY'; end if;
  update public.wallets set balance = balance - amt where user_id = uid;
  update public.bank_accounts set balance = balance + amt where user_id = uid and kind = account returning * into a;
  insert into public.wallet_transactions (user_id, amount, kind, memo) values (uid, -amt, 'bank_deposit', 'Deposit to ' || account);
  insert into public.bank_transactions (user_id, account, amount, kind) values (uid, account, amt, 'deposit');
  return a;
end; $fn$;

create or replace function public.bank_account_withdraw(account text, amount numeric)
returns public.bank_accounts language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); a public.bank_accounts; amt numeric(20,2) := round(amount,2);
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if account not in ('checking','savings','money_market') then raise exception 'Unknown account'; end if;
  if amt is null or amt <= 0 then raise exception 'Enter an amount greater than 0'; end if;
  perform public.bank_account_accrue(account);
  select * into a from public.bank_accounts where user_id = uid and kind = account for update;
  if a.balance < amt then raise exception 'Not enough in that account'; end if;
  update public.bank_accounts set balance = balance - amt where user_id = uid and kind = account returning * into a;
  update public.wallets set balance = balance + amt where user_id = uid;
  insert into public.wallet_transactions (user_id, amount, kind, memo) values (uid, amt, 'bank_withdraw', 'Withdrawal from ' || account);
  insert into public.bank_transactions (user_id, account, amount, kind) values (uid, account, -amt, 'withdraw');
  return a;
end; $fn$;

drop function if exists public.bank_deposit(numeric);
drop function if exists public.bank_withdraw(numeric);
drop function if exists public.bank_accrue_interest();

revoke all on function public.bank_account_accrue(text) from public;
revoke all on function public.bank_account_deposit(text, numeric) from public;
revoke all on function public.bank_account_withdraw(text, numeric) from public;
grant execute on function public.bank_account_accrue(text) to authenticated;
grant execute on function public.bank_account_deposit(text, numeric) to authenticated;
grant execute on function public.bank_account_withdraw(text, numeric) to authenticated;
