-- Galaxy Credits (GLXY): the off-chain ecosystem currency.
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Idempotent: safe to run more than once.
--
-- Security model: balances change ONLY through SECURITY DEFINER functions
-- below. Members can read their own wallet/transactions but have no
-- insert/update/delete policies, so they cannot credit themselves directly.

create table if not exists public.wallets (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  balance    numeric(20, 2) not null default 0,
  created_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
drop policy if exists "wallets_select_own" on public.wallets;
create policy "wallets_select_own" on public.wallets for select
  using (auth.uid() = user_id);

create table if not exists public.wallet_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  amount     numeric(20, 2) not null, -- positive = credit, negative = debit
  kind       text not null,           -- e.g. welcome_bonus, transfer_in, purchase
  memo       text,
  created_at timestamptz not null default now()
);
alter table public.wallet_transactions enable row level security;
drop policy if exists "wallet_tx_select_own" on public.wallet_transactions;
create policy "wallet_tx_select_own" on public.wallet_transactions for select
  using (auth.uid() = user_id);
create index if not exists wallet_tx_user_idx
  on public.wallet_transactions (user_id, created_at desc);

-- One-time welcome grant of 1000 GLXY. Returns the member's wallet either way.
create or replace function public.claim_welcome_bonus()
returns public.wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  w   public.wallets;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into w from public.wallets where user_id = uid;
  if found then
    return w; -- wallet already exists; never double-grant
  end if;

  insert into public.wallets (user_id, balance) values (uid, 1000)
    returning * into w;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (uid, 1000, 'welcome_bonus', 'Welcome to Galaxy500Universe');
  return w;
end;
$$;

revoke all on function public.claim_welcome_bonus() from public;
grant execute on function public.claim_welcome_bonus() to authenticated;
