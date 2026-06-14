-- Galaxy500 Crypto Bank: GLXY savings on top of the wallet.
-- Members deposit spendable GLXY into savings (earns interest) and withdraw
-- back. Balances change ONLY through the SECURITY DEFINER functions below.
-- Run in Supabase SQL Editor. Idempotent: safe to run more than once.

-- Savings fields on the wallet.
alter table public.wallets add column if not exists savings_balance    numeric(20, 2) not null default 0;
alter table public.wallets add column if not exists savings_rate       numeric(6, 4)  not null default 0.0500; -- 5% APY
alter table public.wallets add column if not exists savings_accrued_at timestamptz    not null default now();

-- Bank activity ledger (deposit / withdraw / interest).
create table if not exists public.bank_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  amount     numeric(20, 2) not null,
  kind       text not null,
  created_at timestamptz not null default now()
);
alter table public.bank_transactions enable row level security;
drop policy if exists "bank_tx_select_own" on public.bank_transactions;
create policy "bank_tx_select_own" on public.bank_transactions for select
  using (auth.uid() = user_id);
create index if not exists bank_tx_user_idx
  on public.bank_transactions (user_id, created_at desc);

-- Capitalize interest accrued since the last accrual into the savings balance.
create or replace function public.bank_accrue_interest()
returns public.wallets
language plpgsql security definer set search_path = public
as $fn$
declare
  uid     uuid := auth.uid();
  w       public.wallets;
  pending numeric(20, 2);
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into w from public.wallets where user_id = uid for update;
  if not found then raise exception 'No wallet yet'; end if;

  pending := round(
    w.savings_balance * w.savings_rate
      * (extract(epoch from (now() - w.savings_accrued_at)) / 31536000.0),
    2);

  if pending > 0 then
    update public.wallets
      set savings_balance = savings_balance + pending, savings_accrued_at = now()
      where user_id = uid
      returning * into w;
    insert into public.bank_transactions (user_id, amount, kind)
      values (uid, pending, 'interest');
  end if;
  return w;
end;
$fn$;

-- Move GLXY from spendable balance into savings.
create or replace function public.bank_deposit(amount numeric)
returns public.wallets
language plpgsql security definer set search_path = public
as $fn$
declare uid uuid := auth.uid(); w public.wallets; amt numeric(20,2) := round(amount, 2);
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if amt is null or amt <= 0 then raise exception 'Enter an amount greater than 0'; end if;
  perform public.bank_accrue_interest();
  select * into w from public.wallets where user_id = uid for update;
  if not found then raise exception 'No wallet yet'; end if;
  if w.balance < amt then raise exception 'Not enough spendable GLXY'; end if;

  update public.wallets
    set balance = balance - amt, savings_balance = savings_balance + amt
    where user_id = uid returning * into w;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (uid, -amt, 'bank_deposit', 'Deposit to Crypto Bank');
  insert into public.bank_transactions (user_id, amount, kind)
    values (uid, amt, 'deposit');
  return w;
end;
$fn$;

-- Move GLXY from savings back to spendable balance.
create or replace function public.bank_withdraw(amount numeric)
returns public.wallets
language plpgsql security definer set search_path = public
as $fn$
declare uid uuid := auth.uid(); w public.wallets; amt numeric(20,2) := round(amount, 2);
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if amt is null or amt <= 0 then raise exception 'Enter an amount greater than 0'; end if;
  perform public.bank_accrue_interest();
  select * into w from public.wallets where user_id = uid for update;
  if not found then raise exception 'No wallet yet'; end if;
  if w.savings_balance < amt then raise exception 'Not enough in savings'; end if;

  update public.wallets
    set savings_balance = savings_balance - amt, balance = balance + amt
    where user_id = uid returning * into w;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (uid, amt, 'bank_withdraw', 'Withdrawal from Crypto Bank');
  insert into public.bank_transactions (user_id, amount, kind)
    values (uid, -amt, 'withdraw');
  return w;
end;
$fn$;

revoke all on function public.bank_accrue_interest() from public;
revoke all on function public.bank_deposit(numeric) from public;
revoke all on function public.bank_withdraw(numeric) from public;
grant execute on function public.bank_accrue_interest() to authenticated;
grant execute on function public.bank_deposit(numeric) to authenticated;
grant execute on function public.bank_withdraw(numeric) to authenticated;
